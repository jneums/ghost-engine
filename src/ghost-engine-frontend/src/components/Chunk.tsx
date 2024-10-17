import * as THREE from 'three';
import { useCallback, useMemo, useRef } from 'react';
import { CHUNK_HEIGHT, CHUNK_SIZE } from '../utils/terrain';
import { ThreeEvent } from '@react-three/fiber';

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

  const generateVoxelGeometry = useCallback(() => {
    const positions = [];
    const normals = [];
    const indices = [];

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

              // Check if the neighbor is outside the current chunk
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

              if (!neighbor) {
                const ndx = positions.length / 3;
                for (const pos of corners) {
                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                  normals.push(...dir);
                }
                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
              }
            }
          }
        }
      }
    }

    return { positions, normals, indices };
  }, [data]);

  const geometry = useMemo(() => {
    const { positions, normals, indices } = generateVoxelGeometry();

    geomRef.current.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geomRef.current.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3),
    );
    geomRef.current.setIndex(indices);

    // Compute bounding volumes
    geomRef.current.computeBoundingBox();

    return geomRef.current;
  }, [data]); // Add dependencies if needed

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
    <mesh onClick={handleClick} position={chunkPosition} geometry={geometry}>
      <meshLambertMaterial color={0xaaaaaa} />
    </mesh>
  );
}
