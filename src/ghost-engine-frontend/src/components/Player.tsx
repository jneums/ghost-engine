import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  MoveTargetComponent,
  TransformComponent,
  ClientTransformComponent,
  CombatComponent,
  HealthComponent,
} from '.';
import * as THREE from 'three';
import { useRef, useEffect, useState, useCallback } from 'react';
import LightningBeam from './LightningBeam';
import SetTargetAction from '../actions/set-target';
import { useWorld } from '../context/WorldProvider';
import AttackAction from '../actions/attack-action';
import { MapControls as DreiMapControls } from '@react-three/drei';
import { MapControls } from 'three-stdlib';

const CAMERA_FOLLOW_DISTANCE = 10; // Distance threshold for the camera to start following
const CAMERA_HEIGHT = 10; // Fixed height for the camera

const followDirection = new THREE.Vector3();
const direction = new THREE.Vector3();
const targetQuaternion = new THREE.Quaternion();
const rotationMatrix = new THREE.Matrix4();

export default function Player({ entityId }: { entityId: number }) {
  const { world, playerEntityId, connection } = useWorld();
  const entity = world.getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<MapControls>(null);
  const [combatTargetId, setCombatTargetId] = useState<number | null>(null);

  const velocity = 2; // units per second
  const epsilon = 0.05; // Small value to prevent shaking

  if (!entity) return null;

  const serverTransform = entity.getComponent(TransformComponent);
  const position = entity.getComponent(MoveTargetComponent);
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

  const handleLeftClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      const setTarget = new SetTargetAction(world);
      setTarget.handle({
        entityId: playerEntityId,
        targetEntityId: entityId,
      });
    },
    [playerEntityId, world, entityId],
  );

  const handleRightClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      const setTarget = new SetTargetAction(world);
      setTarget.handle({
        entityId: playerEntityId,
        targetEntityId: entityId,
      });

      const attackAction = new AttackAction(world, connection);
      attackAction.handle({
        entityId: playerEntityId,
        targetEntityId: entityId,
      });
    },
    [
      playerEntityId,
      world,
      entityId,
      isDead,
      serverTransform.position,
      connection,
    ],
  );

  useEffect(() => {
    if (combat) {
      setCombatTargetId(combat.targetEntityId);
    } else {
      setCombatTargetId(null);
    }
  }, [combat]);

  useFrame((state, delta) => {
    if (position && clientTransform && meshRef.current) {
      updatePosition(
        clientTransform,
        position.position,
        delta,
        velocity,
        epsilon,
      );
      meshRef.current.position.copy(clientTransform.position);
      controlsRef.current?.target.copy(clientTransform.position);
    }

    if (!position && clientTransform && serverTransform && meshRef.current) {
      updatePosition(
        clientTransform,
        serverTransform.position,
        delta,
        velocity,
        epsilon,
      );
      meshRef.current.position.copy(clientTransform.position);
      controlsRef.current?.target.copy(clientTransform.position);
    }

    if (isPlayer && controlsRef.current) {
      updateCamera(controlsRef.current, clientTransform.position, delta);
    }

    if (meshRef.current && position) {
      smoothLookAt(meshRef.current, position.position, delta);
    }

    if (isDead) {
      world.removeComponent(entityId, ClientTransformComponent);
      world.removeComponent(entityId, MoveTargetComponent);
    }
  });

  const getCombatTargetPosition = () => {
    if (combatTargetId) {
      const target = world.getEntity(combatTargetId);
      if (target) {
        const targetTransform = target.getComponent(ClientTransformComponent);
        if (targetTransform) {
          return targetTransform.position;
        }
        const targetServerTransform = target.getComponent(TransformComponent);
        return targetServerTransform.position;
      }
    }
    return null;
  };

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
        {isPlayer && (
          <DreiMapControls
            ref={controlsRef}
            target={clientTransform.position}
            enablePan={false}
          />
        )}
      </mesh>
      {combatTargetId && (
        <LightningBeam
          start={clientTransform.position}
          getEndPosition={getCombatTargetPosition}
        />
      )}
    </>
  );
}

function updatePosition(
  clientTransform: TransformComponent,
  targetPosition: THREE.Vector3,
  delta: number,
  velocity: number,
  epsilon: number,
) {
  direction.subVectors(targetPosition, clientTransform.position).normalize();
  const distance = velocity * delta;
  const moveVector = direction.multiplyScalar(distance);

  if (clientTransform.position.distanceTo(targetPosition) > epsilon) {
    clientTransform.position.add(moveVector);
  }
}

function updateCamera(
  controls: MapControls,
  targetPosition: THREE.Vector3,
  delta: number,
) {
  const cameraPosition = controls.object.position;
  const adjustedTargetPosition = targetPosition.clone();
  adjustedTargetPosition.y += CAMERA_HEIGHT;

  const distanceToTarget = cameraPosition.distanceTo(adjustedTargetPosition);
  if (distanceToTarget > CAMERA_FOLLOW_DISTANCE) {
    followDirection
      .subVectors(adjustedTargetPosition, cameraPosition)
      .normalize();
    const followDistance = (distanceToTarget - CAMERA_FOLLOW_DISTANCE) * delta;
    const followVector = followDirection.multiplyScalar(followDistance);

    cameraPosition.add(followVector);
    controls.update();
  }
}

function smoothLookAt(
  mesh: THREE.Mesh,
  targetPosition: THREE.Vector3,
  delta: number,
) {
  rotationMatrix.lookAt(targetPosition, mesh.position, mesh.up);
  const step = 10 * delta;
  targetQuaternion.setFromRotationMatrix(rotationMatrix);
  mesh.quaternion.rotateTowards(targetQuaternion, step);
}
