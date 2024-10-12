import * as THREE from 'three';
import { useState, useEffect, useMemo } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import {
  ClientTransformComponent,
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

  // Create a movement grid for pathfinding
  const movementGrid = useMemo(() => {
    if (!playerEntityId) return null;

    const transform = getEntity(playerEntityId).getComponent(
      ClientTransformComponent,
    );
    if (!transform) return null;

    const playerX = Math.floor(transform.position.x);
    const playerY = Math.floor(transform.position.y);
    const playerZ = Math.floor(transform.position.z);

    const gridSize = 8; // 8 blocks in every direction
    const grid = Array.from({ length: 3 }, () =>
      // 3 layers: above, current, below
      Array.from({ length: gridSize * 2 + 1 }, () =>
        Array(gridSize * 2 + 1).fill(0),
      ),
    );

    // Calculate the grid's world origin
    const gridOrigin = new THREE.Vector3(
      playerX - gridSize,
      playerY,
      playerZ - gridSize,
    );

    // Iterate over the relevant chunks
    Object.values(fetchedChunks).forEach(({ x, z, data }) => {
      const chunkStartX = x * CHUNK_SIZE;
      const chunkStartZ = z * CHUNK_SIZE;

      for (let localX = 0; localX < CHUNK_SIZE; localX++) {
        for (let localZ = 0; localZ < CHUNK_SIZE; localZ++) {
          const worldX = chunkStartX + localX;
          const worldZ = chunkStartZ + localZ;

          // Check if the block is within the grid range
          const gridX = worldX - playerX + gridSize;
          const gridZ = worldZ - playerZ + gridSize;

          if (
            gridX >= 0 &&
            gridX < gridSize * 2 + 1 &&
            gridZ >= 0 &&
            gridZ < gridSize * 2 + 1
          ) {
            // Check the current, below, and lowest Y-levels
            const currentY = playerY;
            const belowY = playerY - 1;
            const lowestY = playerY - 2;

            const currentBlockIndex =
              currentY * CHUNK_SIZE * CHUNK_SIZE + localZ * CHUNK_SIZE + localX;
            const belowBlockIndex =
              belowY * CHUNK_SIZE * CHUNK_SIZE + localZ * CHUNK_SIZE + localX;
            const lowestBlockIndex =
              lowestY * CHUNK_SIZE * CHUNK_SIZE + localZ * CHUNK_SIZE + localX;

            const currentBlockValue = data[currentBlockIndex];
            const belowBlockValue = data[belowBlockIndex];
            const lowestBlockValue = data[lowestBlockIndex];

            // Walkable if current is air and below is solid
            grid[0][gridX][gridZ] =
              currentBlockValue === 0 && belowBlockValue !== 0 ? 1 : 0;

            // Walkable if below is air and lowest is solid
            grid[1][gridX][gridZ] =
              belowBlockValue === 0 && lowestBlockValue !== 0 ? 1 : 0;

            // Walkable if lowest is air and two below is solid
            const twoBelowBlockIndex =
              lowestBlockIndex - CHUNK_SIZE * CHUNK_SIZE;
            grid[2][gridX][gridZ] =
              lowestBlockValue === 0 && data[twoBelowBlockIndex] !== 0 ? 1 : 0;
          }
        }
      }
    });

    return { grid, gridOrigin };
  }, [fetchedChunks, playerEntityId]);

  return { loading, fetchedChunks: Object.values(fetchedChunks), movementGrid };
}
