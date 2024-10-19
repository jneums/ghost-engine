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
import { useWorld } from '../context/WorldProvider';
import useAction from '../hooks/useAction';
import { CAMERA_FOLLOW_DISTANCE, CAMERA_HEIGHT } from '../utils/const';

const PLAYER_WIDTH = 1;
const PLAYER_HEIGHT = 1.8;

export default function Player({ entityId }: { entityId: number }) {
  const { playerEntityId, getEntity, removeComponent } = useWorld();
  const { attack, setTarget } = useAction();
  const entity = getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const [combatTargetId, setCombatTargetId] = useState<number | null>(null);

  const direction = new THREE.Vector3();
  const velocity = 2; // units per second
  const epsilon = 0.05; // Small value to prevent shaking

  if (!entity) return null;

  const serverTransform = entity.getComponent(TransformComponent);
  const moveTarget = entity.getComponent(MoveTargetComponent);
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
  const color = isDead ? 'black' : isPlayer ? 'blue' : 'red';

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      setTarget(playerEntityId, entityId);
      attack(playerEntityId, entityId);
    },
    [playerEntityId, entityId, isDead, serverTransform.position],
  );

  useEffect(() => {
    if (combat) {
      setCombatTargetId(combat.targetEntityId);
    } else {
      setCombatTargetId(null);
    }
  }, [combat]);

  useFrame((state, delta) => {
    let updatedPosition = clientTransform.position;
    if (isPlayer && moveTarget && moveTarget.waypoints.length > 0) {
      updatedPosition = moveTarget.waypoints[0];
    }
    if (!isPlayer && serverTransform) {
      updatedPosition = serverTransform.position;
    }

    // Smoothly rotate the mesh to face the direction of movement
    if (meshRef.current) {
      smoothLookAt(meshRef.current, updatedPosition, delta);
    }

    // Start moving towards the target
    updatePosition(clientTransform, updatedPosition, delta, velocity, epsilon);

    const playerPosition = {
      x: clientTransform.position.x + 0.5 * PLAYER_WIDTH,
      y: clientTransform.position.y + 0.5 * PLAYER_HEIGHT + 0.01,
      z: clientTransform.position.z + 0.5 * PLAYER_WIDTH,
    };
    meshRef.current?.position.copy(playerPosition);

    if (isPlayer && meshRef.current) {
      updateCamera(state.camera, meshRef.current.position, delta);
    }

    if (isDead) {
      removeComponent(entityId, ClientTransformComponent);
      removeComponent(entityId, TransformComponent);
      removeComponent(entityId, MoveTargetComponent);
    }
  });

  const getCombatTargetPosition = useCallback(() => {
    if (combatTargetId) {
      const target = getEntity(combatTargetId);
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
  }, [combatTargetId]);

  const name = entityId.toString();

  return (
    <>
      <mesh
        name={name}
        ref={meshRef}
        onClick={handleClick}
        castShadow
        receiveShadow>
        <boxGeometry args={[PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_WIDTH]} />
        <meshPhongMaterial color={color} />
      </mesh>
      {combatTargetId && (
        <LightningBeam
          start={clientTransform.position}
          getEndPosition={getCombatTargetPosition}
        />
      )}
    </>
  );

  function updatePosition(
    clientTransform: TransformComponent,
    targetPosition: THREE.Vector3,
    delta: number,
    velocity: number,
    epsilon: number,
  ) {
    if (!targetPosition) return;
    // Calculate the direction vector towards the target
    direction.subVectors(targetPosition, clientTransform.position).normalize();

    // Calculate the distance to move this frame
    const distance = velocity * delta;

    // Calculate the remaining distance to the target
    const distanceToTarget =
      clientTransform.position.distanceTo(targetPosition);

    // If the calculated distance exceeds the remaining distance, clamp it
    const moveDistance = Math.min(distance, distanceToTarget);

    // Calculate the movement vector
    const moveVector = direction.multiplyScalar(moveDistance);

    // Move the client position
    clientTransform.position.add(moveVector);

    // Snap to grid if close enough to the target
    if (distanceToTarget <= epsilon) {
      clientTransform.position.set(
        Math.floor(targetPosition.x),
        Math.floor(targetPosition.y),
        Math.floor(targetPosition.z),
      );

      // Remove the waypoint if it has been reached
      if (moveTarget) {
        moveTarget.waypoints.shift();
        if (moveTarget.waypoints.length === 0) {
          removeComponent(entityId, MoveTargetComponent);
        }
      }
    }
  }

  function updateCamera(
    camera: THREE.Camera,
    targetPosition: THREE.Vector3,
    delta: number,
  ) {
    // Calculate the desired camera position based on the player's position and rotation
    const offset = new THREE.Vector3(0, CAMERA_HEIGHT, -CAMERA_FOLLOW_DISTANCE);
    offset.applyQuaternion(
      meshRef.current?.quaternion || new THREE.Quaternion(),
    );

    const desiredPosition = targetPosition.clone().add(offset);

    // Smoothly interpolate the camera's position
    camera.position.lerp(desiredPosition, delta * 0.5); // Adjust the factor for smoothness

    // Ensure the camera is looking at the player
    const lookAtTarget = targetPosition.clone();
    lookAtTarget.y += 2; // Adjust to look slightly above the player

    camera.lookAt(lookAtTarget);
  }

  function smoothLookAt(
    mesh: THREE.Mesh,
    targetPosition: THREE.Vector3,
    delta: number,
  ) {
    if (!targetPosition) return;

    const targetWithOffset = targetPosition.clone();
    targetWithOffset.x += 0.5;
    targetWithOffset.z += 0.5;

    // Calculate the direction to look at, ignoring the Y-axis
    const lookDirection = new THREE.Vector3().subVectors(
      targetWithOffset,
      mesh.position,
    );
    lookDirection.y = 0; // Ignore vertical differences

    // Only rotate if there is movement
    if (lookDirection.lengthSq() > 0.0001) {
      lookDirection.normalize();

      // Create a quaternion for the target rotation
      const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1), // Forward direction
        lookDirection,
      );

      // Smoothly interpolate the current rotation towards the target rotation
      mesh.quaternion.slerp(targetQuaternion, delta * 10); // Adjust the factor for smoothness
    }
  }
}
