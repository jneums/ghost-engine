import * as THREE from 'three';
import { useCallback, useMemo, useRef, useState } from 'react';
import { CHUNK_HEIGHT, CHUNK_SIZE } from '../utils/terrain';
import { ThreeEvent } from '@react-three/fiber';
import { useWorld } from '../context/WorldProvider';
import { ClientTransformComponent } from '.';
import useAction from '../hooks/useAction';
import { useErrorMessage } from '../context/ErrorProvider';
import { BlockType, VERTEX_COLORS, DRAG_THRESHOLD } from '../utils/const';

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
}: {
  x: number;
  z: number;
  data: Uint8Array | number[];
}) {
  const geomRef = useRef(new THREE.BufferGeometry());
  const { playerEntityId, getEntity } = useWorld();
  const { setErrorMessage } = useErrorMessage();
  const { mine } = useAction();
  const [minedVoxelIndex, setMinedVoxelIndex] = useState<number | null>(null);

  const handleMine = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;

      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      const playerEntity = getEntity(playerEntityId);

      const faceNormal = e.face?.normal;
      if (!faceNormal) {
        console.error('Face normal not found');
        return;
      }

      const voxelId = 0;

      const targetPosition = new THREE.Vector3(
        Math.floor(e.point.x + faceNormal.x * (voxelId > 0 ? 0.5 : -0.5)),
        Math.floor(e.point.y + faceNormal.y * (voxelId > 0 ? 0.5 : -0.5)),
        Math.floor(e.point.z + faceNormal.z * (voxelId > 0 ? 0.5 : -0.5)),
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

      if (data[index] === BlockType.Air || data[index] === BlockType.Water) {
        setErrorMessage("I can't mine that!");
        return;
      }

      const transform = playerEntity.getComponent(ClientTransformComponent);
      if (!transform) {
        console.error('Transform component not found');
        return;
      }

      const startPosition = transform.position;

      const MINING_RADIUS = 2;
      const distance = targetPosition.distanceTo(startPosition);
      const inRange = distance < Math.sqrt(3 * MINING_RADIUS);

      if (!inRange) {
        setErrorMessage('You are too far away!');
        return;
      }

      setMinedVoxelIndex(index);
      mine(playerEntityId, targetPosition);
    },
    [playerEntityId, getEntity, mine, setErrorMessage, data],
  );

  const generateVoxelGeometry = useCallback(() => {
    const positions = [];
    const normals = [];
    const indices = [];
    const colors = [];

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

              // Only add the top face for water blocks
              if (voxel === BlockType.Water) {
                // Skip all faces except the top face
                if (dir[1] !== 1) continue;
              }

              if (!neighbor) {
                const ndx = positions.length / 3;
                for (const pos of corners) {
                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                  normals.push(...dir);

                  // Change color if this voxel is being mined
                  if (index === minedVoxelIndex) {
                    colors.push(1, 0, 0, 1); // Red color for mined voxel
                  } else {
                    const block = voxel as BlockType;
                    const color = VERTEX_COLORS[block];
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
      new THREE.Float32BufferAttribute(colors, 4),
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

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    console.log('Clicked chunk:', chunkPosition);
  };

  return (
    <mesh
      onClick={handleClick}
      onContextMenu={handleMine}
      position={chunkPosition}
      geometry={geometry}>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}
