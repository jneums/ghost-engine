import { useMemo } from 'react';
import { useWorld } from '../context/WorldProvider';
import { FetchedChunk } from './useChunks';
import { ClientTransformComponent } from '../components';
import { CHUNK_SIZE } from '../utils/terrain';
import { initializeNeighbors } from '../pathfinding';

export interface Node {
  x: number;
  y: number;
  z: number;
  g: number;
  f: number;
  h: number;
  blockType: number;
  opened: boolean;
  closed: boolean;
  parent: Node | null;
  neighbors: Node[];
}

export default function useMovementGrid(
  radius: number,
  fetchedChunks: FetchedChunk[],
) {
  const { playerEntityId, getEntity } = useWorld();

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

    const gridSize = radius; // Radius in every direction
    const grid: Node[][][] = Array.from({ length: gridSize * 2 + 1 }, () =>
      Array.from({ length: gridSize * 2 + 1 }, () =>
        Array(gridSize * 2 + 1).fill(null),
      ),
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
            // Iterate over each layer, centered around the player's y-position
            for (
              let layerIndex = 0;
              layerIndex < gridSize * 2 + 1;
              layerIndex++
            ) {
              const currentY = playerY - gridSize + layerIndex;
              const belowY = currentY - 1;

              const currentBlockIndex =
                currentY * CHUNK_SIZE * CHUNK_SIZE +
                localZ * CHUNK_SIZE +
                localX;
              const belowBlockIndex =
                belowY * CHUNK_SIZE * CHUNK_SIZE + localZ * CHUNK_SIZE + localX;

              const currentBlockValue = data[currentBlockIndex];
              const belowBlockValue = data[belowBlockIndex];

              // Only create a node if the current block is air and the block below is solid
              if (currentBlockValue === 0 && belowBlockValue !== 0) {
                grid[gridX][layerIndex][gridZ] = {
                  x: worldX,
                  y: currentY,
                  z: worldZ,
                  g: 0,
                  f: 0,
                  h: 0,
                  blockType: belowBlockValue,
                  opened: false,
                  closed: false,
                  parent: null,
                  neighbors: [],
                };
              }
            }
          }
        }
      }
    });

    initializeNeighbors(grid);

    return { grid };
  }, [fetchedChunks, playerEntityId, radius]);

  return movementGrid;
}
