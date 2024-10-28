import * as THREE from 'three';
import { useCallback, useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { CHUNK_HEIGHT, CHUNK_SIZE } from '../const/terrain';
import {
  BlockType,
  TILE_SIZE,
  TILE_TEXTURE_HEIGHT,
  TILE_TEXTURE_WITH,
} from '../const/blocks';
import { FACES } from './faces';

export default function Chunk({
  x,
  z,
  data,
  textureAtlas,
  highlightPosition,
  minedVoxel,
  placingVoxel,
  onBlockAction,
  onMove,
}: {
  x: number;
  z: number;
  data: Uint16Array | number[];
  textureAtlas: THREE.Texture;
  highlightPosition: THREE.Vector3 | null;
  minedVoxel: number | null;
  placingVoxel: number | null;
  onBlockAction: (
    e: ThreeEvent<MouseEvent>,
    data: Uint16Array | number[],
  ) => void;
  onMove: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const geomRef = useRef(new THREE.BufferGeometry());
  const meshRef = useRef<THREE.Mesh>(null);
  const placeholderRef = useRef<THREE.Mesh>(null);
  const highlightRef = useRef<THREE.Mesh>(null);
  const isMobile = window.innerWidth < 768;

  const generateVoxelGeometry = useCallback(() => {
    const positions = [];
    const normals = [];
    const indices = [];
    const uvs = [];
    const colors = []; // Add an array for colors

    const WATER_HEIGHT = 0.6; // Define the height for water blocks

    for (let y = 0; y < CHUNK_HEIGHT; ++y) {
      for (let z = 0; z < CHUNK_SIZE; ++z) {
        for (let x = 0; x < CHUNK_SIZE; ++x) {
          const index = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
          const voxel = data[index];
          if (voxel) {
            for (const { dir, corners, uvRow } of FACES) {
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

              if (
                (voxel === BlockType.Water &&
                  dir[1] === 1 &&
                  neighbor !== BlockType.Water) || // Top face for water
                (voxel !== BlockType.Water &&
                  (neighbor === BlockType.Air || neighbor === BlockType.Water))
              ) {
                const ndx = positions.length / 3;
                for (const { pos, uv } of corners) {
                  const adjustedY =
                    voxel === BlockType.Water ? pos[1] * WATER_HEIGHT : pos[1];
                  positions.push(pos[0] + x, adjustedY + y, pos[2] + z);
                  normals.push(...dir);

                  // Add vertex colors (default to white)
                  colors.push(1, 1, 1);

                  if (voxel > 999) {
                    uvs.push(
                      ((0 + uv[0]) * TILE_SIZE) / TILE_TEXTURE_WITH,
                      1 -
                        ((uvRow + 1 - uv[1]) * TILE_SIZE) / TILE_TEXTURE_HEIGHT,
                    );
                  } else {
                    uvs.push(
                      ((voxel + uv[0]) * TILE_SIZE) / TILE_TEXTURE_WITH,
                      1 -
                        ((uvRow + 1 - uv[1]) * TILE_SIZE) / TILE_TEXTURE_HEIGHT,
                    );
                  }
                }
                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
              }
            }
          }
        }
      }
    }

    return { positions, normals, indices, uvs, colors };
  }, [data]);

  const geometry = useMemo(() => {
    const { positions, normals, indices, uvs } = generateVoxelGeometry();

    geomRef.current.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geomRef.current.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3),
    );
    geomRef.current.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(uvs, 2),
    );
    geomRef.current.setIndex(indices);

    geomRef.current.computeBoundingBox();

    return geomRef.current;
  }, [generateVoxelGeometry]);

  useFrame(() => {
    if (meshRef.current) {
      if (highlightRef.current && highlightPosition && !isMobile) {
        highlightRef.current.position.set(
          highlightPosition.x + 0.5,
          highlightPosition.y + 0.5,
          highlightPosition.z + 0.5,
        );
        highlightRef.current.visible = true;
      } else if (highlightRef.current) {
        highlightRef.current.visible = false;
      }

      const voxelIndex = placingVoxel || minedVoxel;
      if (placeholderRef.current && voxelIndex !== null) {
        const localX = voxelIndex % CHUNK_SIZE;
        const localY = Math.floor(voxelIndex / (CHUNK_SIZE * CHUNK_SIZE));
        const localZ = Math.floor(
          (voxelIndex % (CHUNK_SIZE * CHUNK_SIZE)) / CHUNK_SIZE,
        );

        // Convert local position to world position
        const worldX = localX + x * CHUNK_SIZE;
        const worldY = localY;
        const worldZ = localZ + z * CHUNK_SIZE;

        placeholderRef.current.position.set(
          worldX + 0.5,
          worldY + 0.5,
          worldZ + 0.5,
        );
        placeholderRef.current.visible = true;

        // Set color based on operation
        const material = placeholderRef.current
          .material as THREE.MeshBasicMaterial;
        if (placingVoxel !== null) {
          material.color.set('green'); // Color for placing
        } else if (minedVoxel !== null) {
          material.color.set('red'); // Color for mining
        }
      } else if (placeholderRef.current) {
        placeholderRef.current.visible = false;
      }
    }
  });

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
        ref={meshRef}
        name={`chunk-${x}-${z}`}
        castShadow
        receiveShadow
        onClick={(e) => onBlockAction(e, data)}
        onContextMenu={onMove}
        position={chunkPosition}
        geometry={geometry}
        renderOrder={1}>
        <meshLambertMaterial map={textureAtlas} transparent />
      </mesh>
      <mesh ref={placeholderRef} visible={false}>
        <boxGeometry args={[1.01, 1.01, 1.01]} />
        <meshPhongMaterial color="black" />
      </mesh>
      <mesh ref={highlightRef} visible={false} renderOrder={2}>
        <boxGeometry args={[1.01, 1.01, 1.01]} />
        <meshPhongMaterial color="darkgrey" transparent opacity={0.1} />
      </mesh>
    </>
  );
}
