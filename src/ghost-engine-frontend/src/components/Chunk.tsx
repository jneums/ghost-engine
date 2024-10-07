import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useWorld } from '../context/WorldProvider';
import { useErrorMessage } from '../context/ErrorProvider';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { getIsPlayerDead, getPlayerEntityId } from '../utils';
import MoveAction from '../actions/move-action';
import { CHUNK_HEIGHT, CHUNK_SIZE } from '../utils/terrain';

const DRAG_THRESHOLD = 5;

// Define the faces of a cube
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

const geometry = new THREE.BufferGeometry();

export default function Chunk({ chunkId }: { chunkId: string }) {
  const { world, connection } = useWorld();
  const { identity } = useInternetIdentity();
  const { setErrorMessage } = useErrorMessage();
  const [blocks, setBlocks] = useState<Uint8Array | number[]>([]);

  if (!identity) {
    throw new Error('Identity not found');
  }

  useEffect(() => {
    if (!blocks.length) {
      connection.getChunk(chunkId).then((blocks) => {
        setBlocks(blocks);
      });
      setBlocks(blocks);
    }
  }, [blocks, connection]);

  const principal = identity.getPrincipal();

  const handleRightClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;
      console.log('Floor RIGHT clicked!');

      console.log(principal.toText());

      const playerEntityId = getPlayerEntityId(world, principal);

      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      if (getIsPlayerDead(world, playerEntityId)) {
        console.error('You are dead!');
        setErrorMessage('You are dead!');
        return;
      }
      const move = new MoveAction(world, connection);
      move.handle({
        entityId: playerEntityId,
        position: new THREE.Vector3(e.point.x, CHUNK_HEIGHT, e.point.z),
      });
    },
    [world, connection, setErrorMessage],
  );

  const generateVoxelGeometry = useCallback(() => {
    const positions = [];
    const normals = [];
    const indices = [];

    for (let y = 0; y < CHUNK_HEIGHT; ++y) {
      for (let x = 0; x < CHUNK_SIZE; ++x) {
        for (let z = 0; z < CHUNK_SIZE; ++z) {
          const index = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
          const voxel = blocks[index];
          if (voxel) {
            for (const { dir, corners } of FACES) {
              const neighborX = x + dir[0];
              const neighborY = y + dir[1];
              const neighborZ = z + dir[2];
              const neighborIndex =
                neighborX +
                neighborZ * CHUNK_SIZE +
                neighborY * CHUNK_SIZE * CHUNK_SIZE;
              const neighbor =
                neighborX >= 0 &&
                neighborX < CHUNK_SIZE &&
                neighborY >= 0 &&
                neighborY < CHUNK_HEIGHT &&
                neighborZ >= 0 &&
                neighborZ < CHUNK_SIZE
                  ? blocks[neighborIndex]
                  : 0;
              if (neighborY >= CHUNK_HEIGHT || !neighbor) {
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
  }, [blocks]);

  const geometry = useMemo(() => {
    const { positions, normals, indices } = generateVoxelGeometry();

    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setIndex(indices);

    // Compute bounding volumes
    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    return geom;
  }, [blocks]); // Add dependencies if needed

  if (!blocks.length) {
    return null;
  }

  const position = chunkId
    .split(',')
    .map((pos) => parseFloat(pos) * CHUNK_SIZE) as [number, number, number];

  return (
    <mesh
      position={[position[0], 0, position[2]]} // Set Y position to 0 to align with the ground
      onClick={handleRightClick}
      geometry={geometry}>
      <meshStandardMaterial roughness={1} color={0xaaaaaa} wireframe />
    </mesh>
  );
}
