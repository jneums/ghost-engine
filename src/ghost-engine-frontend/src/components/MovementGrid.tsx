import * as THREE from 'three';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { useErrorMessage } from '../context/ErrorProvider';
import { useCallback, useMemo, useRef } from 'react';
import { useWorld } from '../context/WorldProvider';
import { useConnection } from '../context/ConnectionProvider';
import {
  ClientTransformComponent,
  HealthComponent,
  MoveTargetComponent,
} from '.';
import { FetchedChunk } from '../hooks/useChunks';
import useMovementGrid from '../hooks/useMovementGrid';
import { findPath, Node } from '../pathfinding';
import useAction from '../hooks/useAction';
import {
  BLOCK_TYPES,
  BlockType,
  DRAG_THRESHOLD,
  HEX_COLORS,
} from '../utils/const';

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
  const pathNodeRefs = useRef<Map<string, THREE.Mesh>>(new Map());

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

      const startNode = findNodeByPosition(grid, startPosition);
      const endNode = findNodeByPosition(grid, targetPosition);

      if (!startNode || !endNode) {
        console.error('Start or end node not found');
        setErrorMessage('Start or end node not found');
        return;
      }

      const path = findPath(startNode, endNode);

      if (!path || path.length === 0) {
        console.error('No valid path found');
        setErrorMessage('No valid path found');
        return;
      }

      const waypoints = path.map(([x, y, z]) => new THREE.Vector3(x, y, z));

      updatePath(waypoints);
      move(playerEntityId, waypoints);
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

  const updatePath = useCallback((path: THREE.Vector3[]) => {
    const waypoints = path;
    const waypointSet = new Set(
      waypoints.map(({ x, y, z }) => `${x},${y},${z}`),
    );

    // If we have no path, clear the path nodes
    if (waypoints.length === 0) {
      clearPath();
      return;
    }

    // Update the color of the path nodes
    pathNodeRefs.current.forEach((mesh, key) => {
      if (waypointSet.has(key)) {
        const color =
          mesh.userData.color === HEX_COLORS[BlockType.Water]
            ? 'lightblue'
            : 'silver';
        (mesh.material as THREE.MeshBasicMaterial).color.set(color);
      } else {
        (mesh.material as THREE.MeshBasicMaterial).color.set(
          mesh.userData.color,
        );
      }
    });
  }, []);

  const clearPath = useCallback(() => {
    pathNodeRefs.current.forEach((mesh) => {
      (mesh.material as THREE.MeshBasicMaterial).color.set(mesh.userData.color);
    });
  }, []);

  useFrame(() => {
    if (!playerEntityId) return;
    const playerEntity = getEntity(playerEntityId);
    const moveTarget = playerEntity.getComponent(MoveTargetComponent);

    if (moveTarget) {
      const waypoints = moveTarget.waypoints;
      updatePath(waypoints);
    }
  });

  const gridBoxes = useMemo(() => {
    if (!movementGrid) return null;

    const { grid } = movementGrid;
    if (!grid) return null;
    const gridSize = grid.length;
    const boxes = [];

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const node = grid[x][y][z];

          if (node) {
            const color = HEX_COLORS[BLOCK_TYPES[node.blockType]];
            const key = `${node.x},${node.y},${node.z}`;

            boxes.push(
              <mesh
                key={`grid-${x}-${z}-layer-${y}`}
                ref={(mesh) => {
                  if (mesh) {
                    mesh.userData = { color };
                    pathNodeRefs.current.set(key, mesh);
                  } else {
                    pathNodeRefs.current.delete(key);
                  }
                }}
                onClick={handleMove}
                position={[node.x + 0.5, node.y, node.z + 0.5]}>
                <boxGeometry args={[0.99, 0.01, 0.99]} />
                <meshLambertMaterial color={color} transparent opacity={0.8} />
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
