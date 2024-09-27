import { ThreeEvent } from '@react-three/fiber';
import { TransformComponent } from '.';
import * as THREE from 'three';
import { useRef } from 'react';
import { World } from '../hooks/useWorldState';
import { useEntityId } from '../hooks/useEntityId';
import MineAction from '../actions/mine-action';
import { Connection } from '../connection';
import SetTargetAction from '../actions/set-target';

export default function Mine({
  entityId,
  world,
  connection,
}: {
  entityId: number;
  world: World;
  connection: Connection;
}) {
  const entity = world.getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const playerEntityId = useEntityId(world);

  if (!entity) return null;

  const serverTransform = entity.getComponent(TransformComponent);
  const color = 'blue';

  const handleLeftClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (!playerEntityId) {
      console.error('Player entity not found');
      return;
    }

    console.log('Left click on Mine!');

    // Set target id
    const setTarget = new SetTargetAction(world);
    setTarget.handle({
      entityId: playerEntityId,
      targetEntityId: entityId,
    });
  };

  const handleRightClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (!playerEntityId) {
      console.error('Player entity not found');
      return;
    }

    const playerTransform = world.getEntity(playerEntityId);
    if (!playerTransform) {
      console.error('Player transform not found');
      return;
    }

    // Range check
    const distance = serverTransform.position.distanceTo(
      playerTransform.getComponent(TransformComponent).position,
    );
    if (distance > 3) {
      console.error('Mine is too far away');
      return;
    }

    // Handle mine click
    const mineAction = new MineAction(world, connection);
    mineAction.handle({
      entityId: playerEntityId,
      targetEntityId: entityId,
    });

    console.log('Right click on Mine!');
  };

  return (
    <mesh
      ref={meshRef}
      position={[
        serverTransform.position.x,
        serverTransform.position.y,
        serverTransform.position.z,
      ]}
      onClick={handleLeftClick}
      onContextMenu={handleRightClick}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial color={color} />
    </mesh>
  );
}
