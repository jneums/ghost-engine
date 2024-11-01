import * as THREE from 'three';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import {
  UnitChunksComponent,
  UnitsChunk,
  UnitViewComponent,
  TransformComponent,
} from '../ecs/components';
import { useConnection } from '../context/ConnectionProvider';
import { CHUNK_HEIGHT, CHUNK_SIZE } from '../const/blocks';

export type FetchedChunk = {
  key: string;
  x: number;
  z: number;
  data: Uint16Array | number[];
  updatedAt: number;
};

export default function useChunks() {
  const { unitEntityId, getEntity } = useWorld();
  const { getChunks } = useConnection();
  const { identity } = useInternetIdentity();
  const [loading, setLoading] = useState(false);
  const fetchedChunks = useRef<Record<string, FetchedChunk>>({});
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const entity = unitEntityId ? getEntity(unitEntityId) : null;
  const chunks = entity?.getComponent(UnitChunksComponent);

  const fetchChunkData = useCallback(
    async (chunks: UnitsChunk[]) => {
      if (!identity) {
        console.error('Identity not found');
        return [];
      }

      const maxAttempts = 5;
      const initialDelay = 500;
      let attempt = 0;

      while (attempt < maxAttempts) {
        try {
          const chunkIds = chunks.map(({ chunkId }) => ({
            x: chunkId.x,
            z: chunkId.z,
          }));
          const data = await getChunks(identity, chunkIds);

          if (data.length > 0) {
            return data.map((chunk, idx) => ({
              key: JSON.stringify(chunkIds[idx]),
              x: chunkIds[idx].x,
              z: chunkIds[idx].z,
              data: chunk,
              updatedAt: chunk.length > 0 ? Date.now() : 0,
            }));
          }
        } catch (error) {
          console.error('Error fetching chunk data:', error);
        }

        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      }

      console.warn(
        `Failed to fetch data for chunks: ${JSON.stringify(
          chunks,
        )} after ${maxAttempts} attempts.`,
      );
      return chunks.map((chunk) => ({
        key: JSON.stringify(chunk),
        x: chunk.chunkId.x,
        y: chunk.chunkId.y,
        z: chunk.chunkId.z,
        data: [],
        updatedAt: 0,
      }));
    },
    [identity, getChunks],
  );

  const fetchChunksInPhases = useCallback(async () => {
    if (loading || !identity || !unitEntityId || !entity || !chunks) {
      return;
    }

    setLoading(true);

    const transform = entity.getComponent(TransformComponent);
    if (!transform) {
      setLoading(false);
      return;
    }

    const currentUnitChunk = new THREE.Vector3(
      Math.floor(transform.position.x / CHUNK_SIZE),
      Math.floor(transform.position.y / CHUNK_HEIGHT),
      Math.floor(transform.position.z / CHUNK_SIZE),
    );

    const unitView = entity.getComponent(UnitViewComponent);
    if (!unitView) {
      setLoading(false);
      return;
    }

    try {
      const viewRadius = unitView.viewRadius;
      const maxDistance = Math.floor(viewRadius / CHUNK_SIZE);

      for (let distance = 0; distance <= maxDistance; distance++) {
        const chunksToFetch = chunks.chunks.filter(({ chunkId, updatedAt }) => {
          const dx = chunkId.x - currentUnitChunk.x;
          const dz = chunkId.z - currentUnitChunk.z;
          const key = JSON.stringify({ x: chunkId.x, z: chunkId.z });
          const existingChunk = fetchedChunks.current[key];

          const isDirty =
            !existingChunk?.data.length || existingChunk.updatedAt < updatedAt;

          return Math.max(Math.abs(dx), Math.abs(dz)) === distance && isDirty;
        });

        if (chunksToFetch.length === 0) {
          continue;
        }

        const fetchedData = await fetchChunkData(chunksToFetch);

        const newFetchedChunks: Record<string, FetchedChunk> = {};
        fetchedData.forEach((chunk) => {
          const key = JSON.stringify({ x: chunk.x, z: chunk.z });
          newFetchedChunks[key] = chunk;
        });

        fetchedChunks.current = {
          ...fetchedChunks.current,
          ...newFetchedChunks,
        };
      }
    } catch (error) {
      console.error('Error fetching chunks:', error);
    } finally {
      setLoading(false);
    }
  }, [chunks]);

  // Initialize fetching and set up interval
  const initializeFetching = useCallback(() => {
    fetchChunksInPhases();

    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
    }

    retryIntervalRef.current = setInterval(() => {
      fetchChunksInPhases();
    }, 10000);
  }, [fetchChunksInPhases]);

  // Call initializeFetching when needed, e.g., on component mount or specific events
  useEffect(() => {
    initializeFetching();

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    };
  }, [initializeFetching]);

  return { loading, fetchedChunks: Object.values(fetchedChunks.current) };
}
