import * as THREE from 'three';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import {
  UnitChunksComponent,
  UnitsChunk,
  UnitViewComponent,
  TransformComponent,
} from '../ecs/components';
import { useConnection } from '../context/ConnectionProvider';
import { CHUNK_SIZE } from '../const/terrain';

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
  const [fetchedChunks, setFetchedChunks] = useState<
    Record<string, FetchedChunk>
  >({});
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const entity = unitEntityId ? getEntity(unitEntityId) : null;
  const chunks = entity?.getComponent(UnitChunksComponent);

  const fetchChunkData = useCallback(
    async (chunks: UnitsChunk[]) => {
      if (!identity) {
        throw new Error('Identity not found');
      }

      const maxAttempts = 5; // Maximum number of attempts
      const initialDelay = 500; // Initial delay in milliseconds
      let attempt = 0;

      while (attempt < maxAttempts) {
        try {
          const chunkIds = chunks.map(({ chunkId }) => ({
            x: chunkId.x,
            z: chunkId.z,
          }));
          const data = await getChunks(identity, chunkIds);

          if (data.length > 0) {
            const chunkData = data.map((chunk, idx) => ({
              key: JSON.stringify(chunkIds[idx]),
              x: chunkIds[idx].x,
              z: chunkIds[idx].z,
              data: chunk,
              updatedAt: chunk.length > 0 ? Date.now() : 0,
            }));

            return chunkData;
          }
        } catch (error) {
          console.error('Error fetching chunk data:', error);
        }

        // Incremental backoff
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));

        attempt++;
      }

      // If all attempts fail, return an empty data array
      console.warn(
        `Failed to fetch data for chunks: ${JSON.stringify(
          chunks,
        )} after ${maxAttempts} attempts.`,
      );
      return chunks.map((chunk) => ({
        key: JSON.stringify(chunk),
        x: chunk.chunkId.x,
        z: chunk.chunkId.z,
        data: [],
        updatedAt: 0,
      }));
    },
    [identity, getChunks],
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!identity || !unitEntityId) {
      return;
    }

    if (!entity || !chunks) {
      return;
    }

    const transform = entity.getComponent(TransformComponent);
    if (!transform) {
      return;
    }

    const currentUnitChunk = new THREE.Vector3(
      Math.floor(transform.position.x / CHUNK_SIZE),
      0,
      Math.floor(transform.position.z / CHUNK_SIZE),
    );

    const unitView = entity.getComponent(UnitViewComponent);
    if (!unitView) {
      return;
    }

    const fetchChunksInPhases = async () => {
      setLoading(true);
      try {
        const viewRadius = unitView.viewRadius;
        const maxDistance = Math.floor(viewRadius / CHUNK_SIZE);

        for (let distance = 0; distance <= maxDistance; distance++) {
          const chunksToFetch = chunks.chunks.filter(
            ({ chunkId, updatedAt }) => {
              const dx = chunkId.x - currentUnitChunk.x;
              const dz = chunkId.z - currentUnitChunk.z;
              const key = JSON.stringify({ x: chunkId.x, z: chunkId.z });
              const existingChunk = fetchedChunks[key];

              const isDirty =
                !existingChunk?.data.length ||
                existingChunk.updatedAt < updatedAt;

              return (
                Math.max(Math.abs(dx), Math.abs(dz)) === distance && isDirty
              );
            },
          );

          if (chunksToFetch.length === 0) {
            continue;
          }

          // Batch fetch requests to reduce load
          const batchSize = 5; // Adjust batch size as needed
          for (let i = 0; i < chunksToFetch.length; i += batchSize) {
            const batch = chunksToFetch.slice(i, i + batchSize);
            const fetchedData = await fetchChunkData(batch);

            const newFetchedChunks: Record<string, FetchedChunk> = {};
            fetchedData.forEach((chunk) => {
              const key = JSON.stringify({ x: chunk.x, z: chunk.z });
              newFetchedChunks[key] = chunk;
            });

            // Merge new fetched chunks with existing ones
            setFetchedChunks((prevChunks) => ({
              ...prevChunks,
              ...newFetchedChunks,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching chunks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChunksInPhases();

    // Set up a retry mechanism to periodically attempt to fetch missing chunks
    retryIntervalRef.current = setInterval(() => {
      fetchChunksInPhases();
    }, 10000); // Retry every 10 seconds

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    };
  }, [
    identity,
    unitEntityId,
    getEntity,
    chunks,
    fetchedChunks,
    loading,
    fetchChunkData,
  ]);

  return { loading, fetchedChunks: Object.values(fetchedChunks) };
}
