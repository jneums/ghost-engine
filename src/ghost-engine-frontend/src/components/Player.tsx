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
import { useErrorMessage } from '../context/ErrorProvider';

const CAMERA_FOLLOW_DISTANCE = 7; // Distance threshold for the camera to start following
const CAMERA_HEIGHT = 1.5; // Fixed height for the camera

const followDirection = new THREE.Vector3();
const direction = new THREE.Vector3();
const targetQuaternion = new THREE.Quaternion();
const rotationMatrix = new THREE.Matrix4();

export default function Player({ entityId }: { entityId: number }) {
  const { world, playerEntityId, connection } = useWorld();
  const entity = world.getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<MapControls>(null);
  const arrowHelperRef = useRef<THREE.ArrowHelper>(null);
  const [combatTargetId, setCombatTargetId] = useState<number | null>(null);
  const { setErrorMessage } = useErrorMessage();

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

      const attackAction = new AttackAction(world, connection, setErrorMessage);
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
    const updatedPosition = position
      ? position.position
      : serverTransform.position;

    updatePosition(clientTransform, updatedPosition, delta, velocity, epsilon);
    meshRef.current?.position.copy(clientTransform.position);

    if (isPlayer && controlsRef.current && meshRef.current) {
      updateCamera(
        controlsRef.current,
        clientTransform.position,
        meshRef.current.rotation,
        delta,
        epsilon,
      );
    }

    if (meshRef.current) {
      const targetPosition = getCombatTargetPosition();
      const lookTarget = targetPosition
        ? targetPosition
        : position
        ? position.position
        : serverTransform.position;
      smoothLookAt(meshRef.current, lookTarget, delta);
    }

    if (arrowHelperRef.current && meshRef.current) {
      updateArrowHelper(arrowHelperRef.current, meshRef.current);
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
        onClick={handleRightClick}
        onContextMenu={handleRightClick}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color={color} />
        {isPlayer && (
          <DreiMapControls
            ref={controlsRef}
            enablePan={false}
            enableRotate={false}
          />
        )}
      </mesh>
      <arrowHelper
        ref={arrowHelperRef}
        args={[
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0),
          2,
          0xffff00,
        ]}
      />
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
  targetRotation: THREE.Euler,
  delta: number,
  epsilon: number,
) {
  const cameraPosition = controls.object.position;
  const adjustedTargetPosition = targetPosition.clone();
  adjustedTargetPosition.y += CAMERA_HEIGHT;

  // Calculate the desired camera position behind the player
  const behindOffset = new THREE.Vector3(
    0,
    CAMERA_HEIGHT,
    -CAMERA_FOLLOW_DISTANCE,
  );
  behindOffset.applyEuler(targetRotation);
  const desiredCameraPosition = adjustedTargetPosition
    .clone()
    .add(behindOffset);

  // Smoothly transition the camera to the desired position
  const distanceToTarget = cameraPosition.distanceTo(desiredCameraPosition);
  if (distanceToTarget > epsilon) {
    followDirection
      .subVectors(desiredCameraPosition, cameraPosition)
      .normalize();
    const followDistance = distanceToTarget * delta;
    const followVector = followDirection.multiplyScalar(followDistance);

    cameraPosition.add(followVector);
    controls.update();
  }

  // Ensure the camera is looking at the player
  controls.object.lookAt(targetPosition);
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

function updateArrowHelper(arrowHelper: THREE.ArrowHelper, mesh: THREE.Mesh) {
  const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
  arrowHelper.setDirection(direction);
  arrowHelper.position.copy(mesh.position);
}
