import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useErrorMessage } from '../context/ErrorProvider';
import { useCallback, useMemo } from 'react';
import { useWorld } from '../context/WorldProvider';
import { useConnection } from '../context/ConnectionProvider';
import { ClientTransformComponent, HealthComponent } from '.';
import { FetchedChunk } from '../hooks/useChunks';
import useMovementGrid from '../hooks/useMovementGrid';
import { findPath, Node } from '../pathfinding';
import useAction from '../hooks/useAction';

const DRAG_THRESHOLD = 5;

export default function MovementGrid({
  fetchedChunks,
}: {
  fetchedChunks: FetchedChunk[];
}) {
  const { playerEntityId, getEntity, addComponent } = useWorld();
  const { send } = useConnection();
  const { setErrorMessage } = useErrorMessage();
  const { move } = useAction();

  const movementGrid = useMovementGrid(8, fetchedChunks);

  const findNodeByPosition = (
    nodes: Node[][][],
    position: THREE.Vector3,
  ): Node | null => {
    for (let y = 0; y < nodes.length; y++) {
      for (let x = 0; x < nodes[y].length; x++) {
        for (let z = 0; z < nodes[y][x].length; z++) {
          const node = nodes[y][x][z];
          if (
            node &&
            node.x === position.x &&
            node.y === position.y &&
            node.z === position.z
          ) {
            return node;
          }
        }
      }
    }
    return null;
  };

  const handleMine = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;

      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      const playerEntity = getEntity(playerEntityId);

      const targetPosition = new THREE.Vector3(
        Math.floor(e.point.x),
        Math.floor(e.point.y),
        Math.floor(e.point.z),
      );

      const transform = playerEntity.getComponent(ClientTransformComponent);
      if (!transform) {
        console.error('Transform component not found');
        return;
      }

      const startPosition = transform.position;

      // Calculate the Euclidean distance between two positions
      const distance = targetPosition.distanceTo(startPosition);
      const inRange =
        distance === 1 ||
        distance === Math.sqrt(2) ||
        distance === Math.sqrt(3);

      // Check if the target position is a direct or diagonal neighbor
      if (!inRange) {
        setErrorMessage('You are too far away!');
        return;
      }
    },
    [playerEntityId, getEntity],
  );

  const handleMove = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;
      console.log('Floor LEFT clicked!');

      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      const playerEntity = getEntity(playerEntityId);

      const health = playerEntity.getComponent(HealthComponent);
      if (!health) {
        console.error('Health component not found');
        return;
      }
      if (health && health.amount <= 0) {
        console.error('You are dead!');
        setErrorMessage('You are dead!');
        return;
      }

      const transform = playerEntity.getComponent(ClientTransformComponent);
      if (!transform) {
        console.error('Transform component not found');
        return;
      }

      const startPosition = transform.position;
      const targetPosition = new THREE.Vector3(
        Math.floor(e.point.x),
        Math.floor(e.point.y),
        Math.floor(e.point.z),
      );

      if (!movementGrid) {
        console.error('Movement grid not initialized');
        return;
      }

      const { grid } = movementGrid;

      // console.log('grid:  ', grid);

      // Find start and end nodes
      const startNode = findNodeByPosition(grid, startPosition);
      const endNode = findNodeByPosition(grid, targetPosition);

      if (!startNode || !endNode) {
        console.error('Start or end node not found');
        setErrorMessage('Start or end node not found');
        return;
      }

      // Generate path using A* algorithm
      const path = findPath(startNode, endNode);

      if (!path || path.length === 0) {
        console.error('No valid path found');
        setErrorMessage('No valid path found');
        return;
      }

      move(
        playerEntityId,
        path.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      );
    },
    [
      send,
      addComponent,
      playerEntityId,
      getEntity,
      setErrorMessage,
      movementGrid,
    ],
  );

  const gridBoxes = useMemo(() => {
    if (!movementGrid) return null;

    const { grid } = movementGrid;
    if (!grid) return null;
    const gridSize = grid.length; // Assuming all layers have the same size
    const boxes = [];

    // Calculate the center of the grid
    const centerX = gridSize / 2;
    const centerY = gridSize / 2;
    const centerZ = gridSize / 2;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const node = grid[x][y][z];

          if (node) {
            // Calculate the distance from the center
            const distance = Math.sqrt(
              Math.pow(x - centerX, 2) +
                Math.pow(y - centerY, 2) +
                Math.pow(z - centerZ, 2),
            );

            // Calculate opacity based on distance
            const maxDistance = Math.sqrt(3 * Math.pow(gridSize / 2, 2));
            const opacity = 0.7 - distance / maxDistance;

            boxes.push(
              <mesh
                key={`grid-${x}-${z}-layer-${y}`}
                onContextMenu={handleMine}
                onClick={handleMove}
                position={[
                  node.x + 0.5, // Align with grid origin
                  node.y, // Correctly align with the current layer
                  node.z + 0.5, // Align with grid origin
                ]}>
                <boxGeometry args={[0.99, 0.1, 0.99]} />
                <meshBasicMaterial
                  color="silver"
                  transparent
                  opacity={opacity} // Vary opacity by distance
                />
              </mesh>,
            );
          }
        }
      }
    }

    return boxes;
  }, [movementGrid, handleMove]);

  return <>{gridBoxes}</>;
}
