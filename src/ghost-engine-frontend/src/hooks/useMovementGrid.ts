import * as THREE from 'three';
import { useCallback } from 'react';
import { useWorld } from '../context/WorldProvider';
import { FetchedChunk } from './useChunks';
import { ClientTransformComponent } from '../components';
import { CHUNK_SIZE } from '../utils/terrain';
import { initializeNeighbors } from '../pathfinding';
import { BlockType } from '../utils/const';

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

export default function useMovementGrid(fetchedChunks: FetchedChunk[]) {
  const { playerEntityId, getEntity } = useWorld();

  const createMovementGrid = useCallback(
    (startPosition: THREE.Vector3, targetPosition: THREE.Vector3) => {
      if (!playerEntityId) return null;

      const transform = getEntity(playerEntityId).getComponent(
        ClientTransformComponent,
      );
      if (!transform) return null;

      const startX = Math.floor(startPosition.x);
      const startY = Math.floor(startPosition.y);
      const startZ = Math.floor(startPosition.z);

      const targetX = Math.floor(targetPosition.x);
      const targetY = Math.floor(targetPosition.y);
      const targetZ = Math.floor(targetPosition.z);

      const minX = Math.min(startX, targetX);
      const maxX = Math.max(startX, targetX);
      const minY = Math.min(startY, targetY) - 4;
      const maxY = Math.max(startY, targetY) + 4;
      const minZ = Math.min(startZ, targetZ);
      const maxZ = Math.max(startZ, targetZ);

      const gridSizeX = maxX - minX + 1;
      const gridSizeY = maxY - minY + 1;
      const gridSizeZ = maxZ - minZ + 1;

      const grid: Node[][][] = Array.from({ length: gridSizeX }, () =>
        Array.from({ length: gridSizeY }, () => Array(gridSizeZ).fill(null)),
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
            const gridX = worldX - minX;
            const gridZ = worldZ - minZ;

            if (
              gridX >= 0 &&
              gridX < gridSizeX &&
              gridZ >= 0 &&
              gridZ < gridSizeZ
            ) {
              // Iterate over each layer, centered around the player's y-position
              for (let layerIndex = 0; layerIndex < gridSizeY; layerIndex++) {
                const currentY = minY + layerIndex;
                const belowY = currentY - 1;

                const currentBlockIndex =
                  currentY * CHUNK_SIZE * CHUNK_SIZE +
                  localZ * CHUNK_SIZE +
                  localX;
                const belowBlockIndex =
                  belowY * CHUNK_SIZE * CHUNK_SIZE +
                  localZ * CHUNK_SIZE +
                  localX;

                const currentBlockValue = data[currentBlockIndex];
                const belowBlockValue = data[belowBlockIndex];

                // Valid blocks to stand on:
                // Air with Stone or Water underneath
                // Water with Stone or Water underneath (no walking on top water block)
                const airWithSolidUnderneath =
                  currentBlockValue === BlockType.Air &&
                  belowBlockValue === BlockType.Stone;
                const waterWithSolidUnderneath =
                  currentBlockValue === BlockType.Water &&
                  (belowBlockValue === BlockType.Stone ||
                    belowBlockValue === BlockType.Water);

                if (airWithSolidUnderneath || waterWithSolidUnderneath) {
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

      return grid;
    },
    [fetchedChunks, playerEntityId],
  );

  return createMovementGrid;
}
