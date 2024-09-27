import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  PositionComponent,
  TransformComponent,
  ClientTransformComponent,
  MiningComponent,
} from '.';
import { findPlayersEntityId, getPrincipal } from '../utils';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { isPrincipalEqual } from '../utils';
import * as THREE from 'three';
import { useRef, useEffect, useState } from 'react';
import { World } from '../hooks/useWorldState';
import LightningBeam from './LightningBeam';
import SetTargetAction from '../actions/set-target';

export default function Player({
  entityId,
  world,
}: {
  entityId: number;
  world: World;
}) {
  const { identity } = useInternetIdentity();
  const entity = world.getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = 2; // units per second
  const epsilon = 0.05; // Small value to prevent shaking
  const [miningTarget, setMiningTarget] = useState<THREE.Vector3 | null>(null);

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

  const mining = entity.getComponent(MiningComponent);

  const principal = getPrincipal(entity);
  const isPlayer = isPrincipalEqual(principal, identity?.getPrincipal());
  const color = isPlayer ? 'green' : 'red';

  const playerEntityId = identity
    ? findPlayersEntityId(
        Array.from(world.state.entities.values()),
        identity.getPrincipal(),
      )
    : null;

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

    if (isPlayer) {
      console.log('Right click on my Player');
    } else {
      console.log('Right click on another Player');
    }
  };

  useEffect(() => {
    if (mining) {
      const target = world.getEntity(mining.targetEntityId);
      if (target) {
        const targetTransform = target.getComponent(TransformComponent);
        setMiningTarget(targetTransform.position);
      }
    } else {
      setMiningTarget(null);
    }
  }, [mining]);

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
      {miningTarget && (
        <LightningBeam start={clientTransform.position} end={miningTarget} />
      )}
    </>
  );
}
