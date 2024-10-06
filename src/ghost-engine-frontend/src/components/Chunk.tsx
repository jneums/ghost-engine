import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useWorld } from '../context/WorldProvider';
import { useErrorMessage } from '../context/ErrorProvider';
import { useCallback } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { getIsPlayerDead, getPlayerEntityId } from '../utils';
import MoveAction from '../actions/move-action';

const CHUNK_SIZE = 16;
const DRAG_THRESHOLD = 5;

export default function Chunk({ chunkId }: { chunkId: string }) {
  const { world, connection } = useWorld();
  const { identity } = useInternetIdentity();
  const { setErrorMessage } = useErrorMessage();
  if (!identity) {
    throw new Error('Identity not found');
  }

  const principal = identity.getPrincipal();

  const handleRightClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;
      console.log('Floor RIGHT clicked!');

      console.log(principal.toText());
      console.log(chunkId);

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
        position: new THREE.Vector3(e.point.x, 0, e.point.z),
      });
    },
    [world, connection, setErrorMessage],
  );

  // chunkId = '0.000000,0.000000,-3.000000';
  const position = chunkId
    .split(',')
    .map((pos) => parseFloat(pos) * CHUNK_SIZE) as [number, number, number];

  return (
    <mesh
      position={[position[0], -8, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleRightClick}>
      <boxGeometry args={[16, 16, 16, 16, 16, 16]} />
      <meshBasicMaterial color={0xff0000} side={THREE.DoubleSide} wireframe />
    </mesh>
  );
}
