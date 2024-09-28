import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  PositionComponent,
  TransformComponent,
  ClientTransformComponent,
  CombatComponent,
  HealthComponent,
} from '.';
import * as THREE from 'three';
import { useRef, useEffect, useState } from 'react';
import LightningBeam from './LightningBeam';
import SetTargetAction from '../actions/set-target';
import { useWorld } from '../context/WorldProvider';
import AttackAction from '../actions/attack-action';

export default function Player({ entityId }: { entityId: number }) {
  const { world, playerEntityId, connection } = useWorld();
  const entity = world.getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = 2; // units per second
  const epsilon = 0.05; // Small value to prevent shaking
  const [combatTarget, setCombatTarget] = useState<THREE.Vector3 | null>(null);

  if (!entity) return null;

  const serverTransform = entity.getComponent(TransformComponent);
  const position = entity.getComponent(PositionComponent);
  let clientTransform = entity.getComponent(ClientTransformComponent);

  if (!clientTransform) {
    clientTransform = new ClientTransformComponent(
      serverTransform.position.clone(),
      serverTransform.rotation.clone(),
      serverTransform.scale.clone(),
    );
    entity.addComponent(clientTransform);
  }

  const combat = entity.getComponent(CombatComponent);
  const health = entity.getComponent(HealthComponent);

  const isPlayer = entityId === playerEntityId;
  const isDead = health.amount <= 0;
  const color = isDead ? 'black' : isPlayer ? 'green' : 'red';

  const handleLeftClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!playerEntityId) {
      console.error('Player entity not found');
      return;
    }

    if (isPlayer) {
      console.log('Left click on my Player');
    } else {
      console.log('Left click on another Player');
    }

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

    if (isPlayer) {
      console.log('Right click on my Player');
    } else {
      console.log('Right click on another Player');
    }

    // Set target id
    const setTarget = new SetTargetAction(world);
    setTarget.handle({
      entityId: playerEntityId,
      targetEntityId: entityId,
    });

    if (isDead) {
      console.error('Dead entities cannot be attacked');
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

    // Handle attack click
    const attackAction = new AttackAction(world, connection);
    attackAction.handle({
      entityId: playerEntityId,
      targetEntityId: entityId,
    });
  };

  useEffect(() => {
    if (combat) {
      const target = world.getEntity(combat.targetEntityId);
      if (target) {
        const targetTransform = target.getComponent(TransformComponent);
        setCombatTarget(targetTransform.position);
      }
    } else {
      setCombatTarget(null);
    }
  }, [combat]);

  useFrame((state, delta) => {
    if (position && clientTransform && meshRef.current) {
      const targetPosition = new THREE.Vector3(
        position.position.x,
        position.position.y,
        position.position.z,
      );

      const direction = new THREE.Vector3()
        .subVectors(targetPosition, clientTransform.position)
        .normalize();

      const distance = velocity * delta;
      const moveVector = direction.multiplyScalar(distance);

      if (clientTransform.position.distanceTo(targetPosition) > epsilon) {
        clientTransform.position.add(moveVector);
      }

      meshRef.current.position.copy(clientTransform.position);
    }
    if (!position && clientTransform && serverTransform && meshRef.current) {
      const targetPosition = new THREE.Vector3(
        serverTransform.position.x,
        serverTransform.position.y,
        serverTransform.position.z,
      );

      const direction = new THREE.Vector3()
        .subVectors(targetPosition, clientTransform.position)
        .normalize();

      const distance = velocity * delta;
      const moveVector = direction.multiplyScalar(distance);

      if (clientTransform.position.distanceTo(targetPosition) > epsilon) {
        clientTransform.position.add(moveVector);
      }

      meshRef.current.position.copy(clientTransform.position);
    }
    if (isDead) {
      world.removeComponent(entityId, ClientTransformComponent);
    }
  });

  return (
    <>
      <mesh
        name={entityId.toString()}
        ref={meshRef}
        position={[
          clientTransform.position.x,
          clientTransform.position.y,
          clientTransform.position.z,
        ]}
        onClick={handleLeftClick}
        onContextMenu={handleRightClick}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color={color} />
      </mesh>
      {combatTarget && (
        <LightningBeam start={clientTransform.position} end={combatTarget} />
      )}
    </>
  );
}
