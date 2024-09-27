import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import MoveAction from '../actions/move-action';
import { Connection } from '../connection';
import { findPlayersEntityId } from '../utils';
import { Identity } from '@dfinity/agent';
import { World } from '../hooks/useWorldState';

const DRAG_THRESHOLD = 25;

export default function Ground({
  connection,
  world,
  identity,
}: {
  connection: Connection;
  world: World;
  identity: Identity;
}) {
  const entityId = findPlayersEntityId(
    Array.from(world.state.entities.values()),
    identity.getPrincipal(),
  );

  const handleLeftClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > DRAG_THRESHOLD) return;
    console.log('Floor LEFT clicked!');
  };

  const handleRightClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > DRAG_THRESHOLD || !connection || !entityId) return;
    console.log('Floor RIGHT clicked!');
    const move = new MoveAction(world, connection);
    move.handle({
      entityId,
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
