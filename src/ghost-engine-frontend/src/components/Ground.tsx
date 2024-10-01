import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import MoveAction from '../actions/move-action';
import { useWorld } from '../context/WorldProvider';
import { useErrorMessage } from '../context/ErrorProvider';
import { useCallback } from 'react';

const DRAG_THRESHOLD = 5;

export default function Ground() {
  const { world, connection, playerEntityId, isPlayerDead } = useWorld();
  const { setErrorMessage } = useErrorMessage();

  const handleRightClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;
      console.log('Floor RIGHT clicked!');

      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      if (isPlayerDead) {
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
    [world, connection, playerEntityId, isPlayerDead, setErrorMessage],
  );

  return (
    <mesh
      position={[0, -0.5, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleRightClick}
      onContextMenu={handleRightClick}>
      <planeGeometry args={[120, 120, 120, 120]} />
      <meshBasicMaterial color={0xfefae0} side={THREE.DoubleSide} wireframe />
    </mesh>
  );
}
