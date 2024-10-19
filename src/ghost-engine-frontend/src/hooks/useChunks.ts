import * as THREE from 'three';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import {
  PlayerChunksComponent,
  PlayersChunk,
  PlayerViewComponent,
  TransformComponent,
} from '../components';
import { useConnection } from '../context/ConnectionProvider';
import { CHUNK_SIZE } from '../utils/terrain';

export type FetchedChunk = {
  key: string;
  x: number;
  z: number;
  data: Uint8Array | number[];
  updatedAt: number;
};

export default function useChunks() {
  const { playerEntityId, getEntity } = useWorld();
  const { getChunks } = useConnection();
  const { identity } = useInternetIdentity();
  const [loading, setLoading] = useState(false);
  const [fetchedChunks, setFetchedChunks] = useState<
    Record<string, FetchedChunk>
  >({});
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const entity = playerEntityId ? getEntity(playerEntityId) : null;
  const chunks = entity?.getComponent(PlayerChunksComponent);

  const fetchChunkData = useCallback(
    async (chunks: PlayersChunk[]) => {
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

    if (!identity || !playerEntityId) {
      return;
    }

    if (!entity || !chunks) {
      return;
    }

    const transform = entity.getComponent(TransformComponent);
    if (!transform) {
      return;
    }

    const currentPlayerChunk = new THREE.Vector3(
      Math.floor(transform.position.x / CHUNK_SIZE),
      0,
      Math.floor(transform.position.z / CHUNK_SIZE),
    );

    const playerView = entity.getComponent(PlayerViewComponent);
    if (!playerView) {
      return;
    }

    const fetchChunksInPhases = async () => {
      setLoading(true);
      try {
        const viewRadius = playerView.viewRadius;
        const maxDistance = Math.floor(viewRadius / CHUNK_SIZE);

        for (let distance = 0; distance <= maxDistance; distance++) {
          const chunksToFetch = chunks.chunks.filter(
            ({ chunkId, updatedAt }) => {
              const dx = chunkId.x - currentPlayerChunk.x;
              const dz = chunkId.z - currentPlayerChunk.z;
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
    playerEntityId,
    getEntity,
    chunks,
    fetchedChunks,
    loading,
    fetchChunkData,
  ]);

  return { loading, fetchedChunks: Object.values(fetchedChunks) };
}
