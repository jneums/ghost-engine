import * as THREE from 'three';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHUNK_HEIGHT, CHUNK_SIZE } from '../const/terrain';
import { ThreeEvent } from '@react-three/fiber';
import { useWorld } from '../context/WorldProvider';
import {
  ClientTransformComponent,
  FungibleComponent,
  HealthComponent,
  MiningComponent,
  MoveTargetComponent,
  PlaceBlockComponent,
} from '../ecs/components';
import useAction from '../hooks/useAction';
import { useErrorMessage } from '../context/ErrorProvider';
import { findNodeByPosition, findPath, Node } from '../pathfinding';
import { DRAG_THRESHOLD } from '../const/controls';
import { BlockType, MINING_RADIUS, VERTEX_COLORS } from '../const/blocks';
import { toBaseUnit } from '../utils/tokens';

const FACES = [
  {
    dir: [-1, 0, 0],
    corners: [
      [0, 1, 0],
      [0, 0, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  },
  {
    dir: [1, 0, 0],
    corners: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
  {
    dir: [0, -1, 0],
    corners: [
      [1, 0, 1],
      [0, 0, 1],
      [1, 0, 0],
      [0, 0, 0],
    ],
  },
  {
    dir: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 0],
    ],
  },
  {
    dir: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
    ],
  },
];

export default function Chunk({
  x,
  z,
  data,
  createGrid,
}: {
  x: number;
  z: number;
  data: Uint16Array | number[];
  createGrid: (
    start: THREE.Vector3,
    target: THREE.Vector3,
  ) => Node[][][] | null;
}) {
  const geomRef = useRef(new THREE.BufferGeometry());
  const placeholderRef = useRef<THREE.Mesh>(null);
  const { unitEntityId, getEntity, activeBlock } = useWorld();
  const { setErrorMessage } = useErrorMessage();
  const { mine, move, placeBlock } = useAction();
  const [minedVoxelIndex, setMinedVoxelIndex] = useState<number | null>(null);

  const handleBlockAction = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;

      if (!unitEntityId) {
        console.error('Unit entity not found');
        return;
      }

      const unitEntity = getEntity(unitEntityId);

      const faceNormal = e.face?.normal;
      if (!faceNormal) {
        console.error('Face normal not found');
        return;
      }

      const voxelId = activeBlock;

      const targetPosition = new THREE.Vector3(
        Math.floor(e.point.x + faceNormal.x * (voxelId ? 0.5 : -0.5)),
        Math.floor(e.point.y + faceNormal.y * (voxelId ? 0.5 : -0.5)),
        Math.floor(e.point.z + faceNormal.z * (voxelId ? 0.5 : -0.5)),
      );

      const localPosition = new THREE.Vector3(
        ((targetPosition.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
        targetPosition.y,
        ((targetPosition.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
      );

      const index =
        localPosition.x +
        localPosition.z * CHUNK_SIZE +
        localPosition.y * CHUNK_SIZE * CHUNK_SIZE;

      if (index < 0 || index >= data.length) {
        console.error('Index out of bounds:', index);
        return;
      }

      const transform = unitEntity.getComponent(ClientTransformComponent);
      if (!transform) {
        console.error('Transform component not found');
        return;
      }

      const startPosition = transform.position;
      const distance = targetPosition.distanceTo(startPosition);
      const inRange = distance < Math.sqrt(3 * MINING_RADIUS);

      if (!inRange) {
        setErrorMessage('You are too far away!');
        return;
      }

      if (!voxelId) {
        // Mine the block
        if (data[index] === BlockType.Air || data[index] === BlockType.Water) {
          setErrorMessage("I can't mine that!");
          return;
        }
        setMinedVoxelIndex(index);
        mine(unitEntityId, targetPosition);
      } else {
        // Make sure the unit has the block to place
        const fungible = unitEntity.getComponent(FungibleComponent);
        const token = fungible?.tokens.find(
          (t) => t.cid.toText() === voxelId.toText(),
        );
        if (!token || token.amount < toBaseUnit(1, token.decimals)) {
          setErrorMessage('You do not have enough blocks to place!');
          return;
        }
        // Place the block
        if (data[index] !== BlockType.Air) {
          console.log('Block: ', data[index]);
          setErrorMessage('Block already exists here!');
          return;
        }
        if (placeholderRef.current) {
          placeholderRef.current.position.set(
            targetPosition.x + 0.5,
            targetPosition.y + 0.5,
            targetPosition.z + 0.5,
          );
          placeholderRef.current.visible = true;
        }
        placeBlock(unitEntityId, targetPosition, voxelId);
      }
    },
    [
      unitEntityId,
      getEntity,
      mine,
      placeBlock,
      setErrorMessage,
      data,
      activeBlock,
    ],
  );

  useEffect(() => {
    if (minedVoxelIndex === null) return;
    const mining = unitEntityId
      ? getEntity(unitEntityId)?.getComponent(MiningComponent)
      : null;
    if (!mining) {
      setMinedVoxelIndex(null);
    }
  }, [minedVoxelIndex, unitEntityId, getEntity]);

  const generateVoxelGeometry = useCallback(() => {
    const positions = [];
    const normals = [];
    const indices = [];
    const colors = [];

    const WATER_HEIGHT = 0.6; // Define the height for water blocks

    const mining = unitEntityId
      ? getEntity(unitEntityId)?.getComponent(MiningComponent)
      : null;
    if (!mining) {
      setMinedVoxelIndex(null);
    }

    const placing = unitEntityId
      ? getEntity(unitEntityId)?.getComponent(PlaceBlockComponent)
      : null;
    if (!placing && placeholderRef.current) {
      placeholderRef.current.visible = false;
    }

    for (let y = 0; y < CHUNK_HEIGHT; ++y) {
      for (let z = 0; z < CHUNK_SIZE; ++z) {
        for (let x = 0; x < CHUNK_SIZE; ++x) {
          const index = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
          const voxel = data[index];
          if (voxel) {
            for (const { dir, corners } of FACES) {
              const neighborX = x + dir[0];
              const neighborY = y + dir[1];
              const neighborZ = z + dir[2];

              const isOutsideChunk =
                neighborX < 0 ||
                neighborX >= CHUNK_SIZE ||
                neighborY < 0 ||
                neighborY >= CHUNK_HEIGHT ||
                neighborZ < 0 ||
                neighborZ >= CHUNK_SIZE;

              let neighbor = 0;
              if (!isOutsideChunk) {
                const neighborIndex =
                  neighborX +
                  neighborZ * CHUNK_SIZE +
                  neighborY * CHUNK_SIZE * CHUNK_SIZE;
                neighbor = data[neighborIndex] || 0;
              }

              if (neighbor === BlockType.Air || neighbor === BlockType.Water) {
                const ndx = positions.length / 3;
                for (const pos of corners) {
                  // Adjust the height for water blocks
                  const adjustedY =
                    voxel === BlockType.Water ? pos[1] * WATER_HEIGHT : pos[1];
                  positions.push(pos[0] + x, adjustedY + y, pos[2] + z);
                  normals.push(...dir);

                  // Change color if this voxel is being mined
                  if (index === minedVoxelIndex) {
                    colors.push(1, 0, 0); // Red color for mined voxel
                  } else {
                    const block = voxel as BlockType;
                    const color = VERTEX_COLORS[block] || [1, 0, 1];
                    colors.push(...color); // Use color with opacity
                  }
                }
                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
              }
            }
          }
        }
      }
    }

    return { positions, normals, indices, colors };
  }, [data, minedVoxelIndex]);

  const handleMove = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;
      console.log('Floor LEFT clicked!');

      if (!unitEntityId) {
        console.error('Unit entity not found');
        return;
      }

      const unitEntity = getEntity(unitEntityId);

      const health = unitEntity.getComponent(HealthComponent);
      if (!health) {
        console.error('Health component not found');
        return;
      }
      if (health && health.amount <= 0) {
        console.error('You are dead!');
        setErrorMessage('You are dead!');
        return;
      }

      const transform = unitEntity.getComponent(ClientTransformComponent);
      if (!transform) {
        console.error('Transform component not found');
        return;
      }

      // Determine the starting position for the new path
      let startPosition = new THREE.Vector3(
        Math.round(transform.position.x),
        Math.round(transform.position.y),
        Math.round(transform.position.z),
      );

      const moveTarget = unitEntity.getComponent(MoveTargetComponent);
      if (moveTarget && moveTarget.waypoints.length > 1) {
        // Use the next waypoint as the starting position if the unit is already moving
        startPosition = moveTarget.waypoints[1];
      }

      const targetPosition = new THREE.Vector3(
        Math.floor(e.point.x),
        Math.floor(e.point.y),
        Math.floor(e.point.z),
      );

      const grid = createGrid(startPosition, targetPosition);

      if (!grid) {
        console.error('Grid not found');
        setErrorMessage('Cannot find path');
        return;
      }

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
      move(unitEntityId, waypoints);
    },
    [move, unitEntityId, getEntity, setErrorMessage, createGrid],
  );

  const geometry = useMemo(() => {
    const { positions, normals, indices, colors } = generateVoxelGeometry();

    geomRef.current.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geomRef.current.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3),
    );
    geomRef.current.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3),
    );
    geomRef.current.setIndex(indices);

    geomRef.current.computeBoundingBox();

    return geomRef.current;
  }, [generateVoxelGeometry]);

  if (!data.length) {
    return null;
  }

  const chunkPosition = [x * CHUNK_SIZE, 0, z * CHUNK_SIZE] as [
    number,
    number,
    number,
  ];

  return (
    <>
      <mesh
        onClick={handleMove}
        onContextMenu={handleBlockAction}
        position={chunkPosition}
        geometry={geometry}>
        <meshLambertMaterial vertexColors />
      </mesh>
      <mesh ref={placeholderRef} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="blue" transparent opacity={0.5} />
      </mesh>
    </>
  );
}
