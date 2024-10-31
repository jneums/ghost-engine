import * as THREE from 'three';
import { useCallback } from 'react';
import { useWorld } from '../context/WorldProvider';
import { FetchedChunk } from './useChunks';
import { ClientTransformComponent } from '../ecs/components';
import { CHUNK_SIZE } from '../const/terrain';
import { initializeNeighbors } from '../pathfinding';
import { Node } from '../pathfinding';
import { BlockType } from '../const/blocks';

export default function useMovementGrid(fetchedChunks: FetchedChunk[]) {
  const { unitEntityId, getEntity } = useWorld();

  const createMovementGrid = useCallback(
    (startPosition: THREE.Vector3, targetPosition: THREE.Vector3) => {
      if (!unitEntityId) return null;

      const transform = getEntity(unitEntityId).getComponent(
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
      const minY = Math.min(startY, targetY);
      const maxY = Math.max(startY, targetY);
      const minZ = Math.min(startZ, targetZ);
      const maxZ = Math.max(startZ, targetZ);

      const gridSizeX = maxX - minX + 1;
      const gridSizeY = maxY - minY + 1;
      const gridSizeZ = maxZ - minZ + 1;

      const grid: Node[][][] = Array.from({ length: gridSizeX }, () =>
        Array.from({ length: gridSizeY }, () => Array(gridSizeZ).fill(null)),
      );

      // Helper function to get block value from fetched chunks
      const getBlockValue = (
        worldX: number,
        worldY: number,
        worldZ: number,
      ) => {
        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkY = Math.floor(worldY / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);

        // Ensure local coordinates are positive
        const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localY = ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        const chunk = fetchedChunks.find(
          (chunk) =>
            chunk.x === chunkX && chunk.y === chunkY && chunk.z === chunkZ,
        );

        if (!chunk) return undefined;

        const blockIndex =
          localY * CHUNK_SIZE * CHUNK_SIZE + localZ * CHUNK_SIZE + localX;

        return chunk.data[blockIndex];
      };

      // Iterate over the relevant chunks
      for (let worldX = minX; worldX <= maxX; worldX++) {
        for (let worldY = minY; worldY <= maxY; worldY++) {
          for (let worldZ = minZ; worldZ <= maxZ; worldZ++) {
            const gridX = worldX - minX;
            const gridY = worldY - minY;
            const gridZ = worldZ - minZ;

            const currentBlockValue = getBlockValue(worldX, worldY, worldZ);
            const aboveBlockValue = getBlockValue(worldX, worldY + 1, worldZ);
            const belowBlockValue = getBlockValue(worldX, worldY - 1, worldZ);

            if (
              aboveBlockValue === undefined ||
              currentBlockValue === undefined ||
              belowBlockValue === undefined
            ) {
              console.log('Invalid block index:', worldX, worldY, worldZ);
              continue;
            }

            const airWithSolidUnderneath =
              aboveBlockValue === BlockType.Air &&
              currentBlockValue === BlockType.Air &&
              belowBlockValue !== BlockType.Air &&
              belowBlockValue !== BlockType.Water;
            const waterWithSolidUnderneath =
              aboveBlockValue === BlockType.Air &&
              currentBlockValue === BlockType.Water &&
              (belowBlockValue === BlockType.Stone ||
                belowBlockValue === BlockType.Water);

            const isValidPosition =
              airWithSolidUnderneath || waterWithSolidUnderneath;

            if (isValidPosition) {
              grid[gridX][gridY][gridZ] = {
                x: worldX,
                y: worldY,
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

      initializeNeighbors(grid);

      return grid;
    },
    [fetchedChunks, unitEntityId],
  );

  return createMovementGrid;
}
