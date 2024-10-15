import * as THREE from 'three';
import { useState, useEffect } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import {
  PlayerChunksComponent,
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
};

export default function useChunks() {
  const { playerEntityId, getEntity } = useWorld();
  const isMobile = window.innerWidth < 768;
  const { getChunk } = useConnection();
  const { identity } = useInternetIdentity();
  const [loading, setLoading] = useState(true);
  const [fetchedChunks, setFetchedChunks] = useState<
    Record<string, FetchedChunk>
  >({});

  async function fetchChunkData(chunk: { x: number; z: number }) {
    const maxAttempts = 5; // Maximum number of attempts
    const initialDelay = 500; // Initial delay in milliseconds
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        const data = await getChunk({ x: chunk.x, y: 0, z: chunk.z });

        if (data.length > 0) {
          return {
            key: JSON.stringify(chunk),
            x: chunk.x,
            z: chunk.z,
            data: data,
          };
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
      `Failed to fetch data for chunk: ${JSON.stringify(
        chunk,
      )} after ${maxAttempts} attempts.`,
    );
    return {
      key: JSON.stringify(chunk),
      x: chunk.x,
      z: chunk.z,
      data: [],
    };
  }

  useEffect(() => {
    if (!identity || !playerEntityId) {
      return;
    }

    const entity = getEntity(playerEntityId);
    if (!entity) {
      return;
    }

    const chunks = entity.getComponent(PlayerChunksComponent);
    if (!chunks) {
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
        const viewRadius = isMobile ? 32 : playerView.viewRadius;
        const maxDistance = Math.floor(viewRadius / CHUNK_SIZE);

        for (let distance = 0; distance <= maxDistance; distance++) {
          const chunksToFetch = chunks.chunks.filter((chunk) => {
            const dx = chunk.x - currentPlayerChunk.x;
            const dz = chunk.z - currentPlayerChunk.z;
            const key = JSON.stringify({ x: chunk.x, z: chunk.z });
            return (
              Math.max(Math.abs(dx), Math.abs(dz)) === distance &&
              !fetchedChunks[key]?.data.length
            );
          });

          const fetchedData = await Promise.all(
            chunksToFetch.map(fetchChunkData),
          );

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
      } catch (error) {
        console.error('Error fetching chunks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChunksInPhases();
  }, [identity, playerEntityId, getEntity]);

  return { loading, fetchedChunks: Object.values(fetchedChunks) };
}
