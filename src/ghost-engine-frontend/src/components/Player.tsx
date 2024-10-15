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
import AttackAction from '../actions/attack-action';
import { useErrorMessage } from '../context/ErrorProvider';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import { useConnection } from '../context/ConnectionProvider';
import { useCamera } from '../context/CameraProvider';
import PlayerIndicator from './PlayerIndicator';

const PLAYER_WIDTH = 1;
const PLAYER_HEIGHT = 1.8;

export default function Player({ entityId }: { entityId: number }) {
  const { cameraAngle } = useCamera();
  const { playerEntityId, getEntity, addComponent, removeComponent } =
    useWorld();
  const { send } = useConnection();
  const { identity } = useInternetIdentity();
  const entity = getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const [combatTargetId, setCombatTargetId] = useState<number | null>(null);
  const { setErrorMessage } = useErrorMessage();

  const CAMERA_DISTANCE = 15; // Distance from the player
  const CAMERA_VERTICAL_ANGLE = Math.atan(1 / Math.sqrt(2)); // 35.264 degrees for isometric view

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

  if (!identity) {
    throw new Error('Identity not found');
  }

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

      const setTarget = new SetTargetAction(addComponent);
      setTarget.handle({
        entityId: playerEntityId,
        targetEntityId: entityId,
      });

      const attackAction = new AttackAction(
        getEntity,
        addComponent,
        setErrorMessage,
        send,
      );
      attackAction.handle({
        entityId: playerEntityId,
        targetEntityId: entityId,
      });
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

    // Start moving towards the target
    updatePosition(clientTransform, updatedPosition, delta, velocity, epsilon);

    meshRef.current?.position.copy({
      x: clientTransform.position.x + 0.5 * PLAYER_WIDTH,
      y: clientTransform.position.y + 0.5 * PLAYER_HEIGHT,
      z: clientTransform.position.z + 0.5 * PLAYER_WIDTH,
    });

    if (isPlayer && meshRef.current) {
      updateCamera(state.camera, clientTransform.position);
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
        <boxGeometry args={[1, 2, 1]} />
        <meshPhongMaterial color={color} />
        <PlayerIndicator />
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

  function updateCamera(camera: THREE.Camera, targetPosition: THREE.Vector3) {
    // Set the camera position for an isometric view
    const cameraOffset = new THREE.Vector3(
      CAMERA_DISTANCE * Math.cos(cameraAngle) * Math.cos(CAMERA_VERTICAL_ANGLE),
      CAMERA_DISTANCE * Math.sin(CAMERA_VERTICAL_ANGLE),
      CAMERA_DISTANCE * Math.sin(cameraAngle) * Math.cos(CAMERA_VERTICAL_ANGLE),
    );
    const cameraPosition = targetPosition.clone().add(cameraOffset);
    camera.position.copy(cameraPosition);

    // Ensure the camera is looking at the player
    camera.lookAt(targetPosition);
  }
}
