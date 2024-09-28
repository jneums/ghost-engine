import { ThreeEvent } from '@react-three/fiber';
import { HealthComponent, TransformComponent } from '.';
import * as THREE from 'three';
import { useRef } from 'react';
import AttackAction from '../actions/attack-action';
import SetTargetAction from '../actions/set-target';
import { useWorld } from '../context/WorldProvider';

export default function Mine({ entityId }: { entityId: number }) {
  const { world, connection, playerEntityId } = useWorld();
  const entity = world.getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);

  if (!entity) return null;

  const serverTransform = entity.getComponent(TransformComponent);
  const health = entity.getComponent(HealthComponent);

  const isDead = health.amount <= 0;
  const color = isDead ? 'black' : 'blue';

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

    // Set target id
    const setTarget = new SetTargetAction(world);
    setTarget.handle({
      entityId: playerEntityId,
      targetEntityId: entityId,
    });

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

    // Handle attack click
    const attackAction = new AttackAction(world, connection);
    attackAction.handle({
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
