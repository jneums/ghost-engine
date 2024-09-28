import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import MoveAction from '../actions/move-action';
import { useWorld } from '../context/WorldProvider';

const DRAG_THRESHOLD = 5;

export default function Ground() {
  const { world, connection, playerEntityId, isPlayerDead } = useWorld();

  const handleLeftClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > DRAG_THRESHOLD) return;
    console.log('Floor LEFT clicked!');
  };

  const handleRightClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > DRAG_THRESHOLD) return;
    console.log('Floor RIGHT clicked!');

    if (!playerEntityId) {
      console.error('Player entity not found');
      return;
    }

    if (isPlayerDead) {
      console.error('You are dead!');
      return;
    }
    const move = new MoveAction(world, connection);
    move.handle({
      entityId: playerEntityId,
      position: new THREE.Vector3(e.point.x, 0, e.point.z),
    });
  };

  return (
    <mesh
      position={[0, -0.5, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleLeftClick}
      onContextMenu={handleRightClick}>
      <planeGeometry args={[120, 120, 120, 120]} />
      <meshBasicMaterial color={0xfefae0} side={THREE.DoubleSide} wireframe />
    </mesh>
  );
}
