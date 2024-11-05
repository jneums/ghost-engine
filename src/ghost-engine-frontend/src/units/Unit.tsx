import React, { useRef, useCallback, useState, useEffect } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  MoveTargetComponent,
  TransformComponent,
  ClientTransformComponent,
  CombatComponent,
  HealthComponent,
  MiningComponent,
} from '../ecs/components';
import LightningBeam from './LightningBeam';
import { useWorld } from '../context/WorldProvider';
import useAction from '../hooks/useAction';
import { CAMERA_FOLLOW_DISTANCE } from '../const/camera';
import { updatePosition, smoothLookAt } from './utils';
import { UNIT_HEIGHT, UNIT_VELOCITY, UNIT_WIDTH } from '../const/units';
import { Sky } from '@react-three/drei';
import useCameraControls from '../hooks/useCameraControls';

// Create a raycaster for collision detection
const raycaster = new THREE.Raycaster();
const cameraDirection = new THREE.Vector3();

const Unit = React.memo(function Unit({
  entityId,
  isUserControlled,
}: {
  entityId: number;
  isUserControlled?: boolean;
}) {
  const { unitEntityId, getEntity, removeComponent } = useWorld();
  const { attack, setTarget } = useAction();
  const entity = getEntity(entityId);
  const [combatTargetId, setCombatTargetId] = useState<number | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const lightningBeamSourceRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const { zoomLevel, rotation } = useCameraControls();

  if (!entity) return null;

  const serverTransform = entity.getComponent(TransformComponent);
  const moveTarget = entity.getComponent(MoveTargetComponent);
  let clientTransform = entity.getComponent(ClientTransformComponent);
  const combat = entity.getComponent(CombatComponent);
  const mining = entity.getComponent(MiningComponent);
  const health = entity.getComponent(HealthComponent);

  const isDead = health?.amount <= 0;
  const color = isDead ? 'black' : isUserControlled ? 'blue' : 'red';

  if (!clientTransform && serverTransform) {
    clientTransform = new ClientTransformComponent(
      serverTransform.position.clone(),
      serverTransform.rotation.clone(),
      serverTransform.scale.clone(),
    );
    entity.addComponent(clientTransform);
  }

  const handleTarget = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (unitEntityId === entityId) {
        return;
      }

      event.stopPropagation();
      if (!unitEntityId) {
        console.error('Player entity not found');
        return;
      }

      setTarget(unitEntityId, entityId);
    },
    [unitEntityId, entityId, setTarget],
  );

  const handleAttack = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (unitEntityId === entityId) {
        return;
      }

      event.stopPropagation();
      if (!unitEntityId) {
        console.error('Player entity not found');
        return;
      }

      setTarget(unitEntityId, entityId);
      attack(unitEntityId, entityId);
    },
    [unitEntityId, entityId, setTarget, attack],
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
    if (isUserControlled && moveTarget && moveTarget.waypoints.length > 0) {
      updatedPosition = moveTarget.waypoints[0];
    } else if (serverTransform) {
      updatedPosition = serverTransform.position;
    }

    // Smoothly rotate the mesh to face the direction of movement
    if (meshRef.current) {
      if (mining && mining.positions) {
        smoothLookAt(meshRef.current, mining.positions[0], delta);
      } else {
        smoothLookAt(meshRef.current, updatedPosition, delta);
      }
    }

    updatePosition(
      clientTransform,
      updatedPosition,
      delta,
      UNIT_VELOCITY,
      0.05,
      moveTarget,
      removeComponent,
      entityId,
    );

    const unitPosition = {
      x: clientTransform.position.x + 0.5 * UNIT_WIDTH,
      y: clientTransform.position.y + 0.5 * UNIT_HEIGHT,
      z: clientTransform.position.z + 0.5 * UNIT_WIDTH,
    };
    meshRef.current?.position.copy(unitPosition);
    lightningBeamSourceRef.current.copy(clientTransform.position);
    lightningBeamSourceRef.current.y += 0.5 * UNIT_HEIGHT;

    if (isUserControlled && meshRef.current) {
      const radius = CAMERA_FOLLOW_DISTANCE * zoomLevel;
      const cameraOffset = new THREE.Vector3(
        radius * Math.sin(rotation.polar) * Math.sin(rotation.azimuthal),
        radius * Math.cos(rotation.polar) + 0.25 * UNIT_HEIGHT,
        radius * Math.sin(rotation.polar) * Math.cos(rotation.azimuthal),
      );

      const desiredCameraPosition = meshRef.current.position
        .clone()
        .add(cameraOffset);

      cameraDirection
        .subVectors(desiredCameraPosition, meshRef.current.position)
        .normalize();
      raycaster.set(meshRef.current.position, cameraDirection);

      const bufferDistance = 1.0;
      const maxRaycastDistance =
        CAMERA_FOLLOW_DISTANCE * zoomLevel + bufferDistance;
      raycaster.far = maxRaycastDistance;

      const closestIntersection = state.scene.children
        .filter((child) => child.name.startsWith('chunk'))
        .flatMap((child) => raycaster.intersectObject(child, true))
        .reduce<THREE.Intersection | null>((closest, intersect) => {
          if (!closest || intersect.distance < closest.distance) {
            return intersect;
          }
          return closest;
        }, null);

      if (closestIntersection) {
        const intersectionPoint = closestIntersection.point;
        const direction = new THREE.Vector3()
          .subVectors(intersectionPoint, meshRef.current.position)
          .normalize();

        const safePosition = intersectionPoint
          .clone()
          .add(direction.multiplyScalar(0.1));

        const adjustedPosition = meshRef.current.position
          .clone()
          .lerp(safePosition, 0.7);

        state.camera.position.lerp(adjustedPosition, 0.8);
      } else {
        state.camera.position.copy(
          meshRef.current.position.clone().add(cameraOffset),
        );
      }

      const lookAtPosition = meshRef.current.position.clone();
      lookAtPosition.y += 0.5 * UNIT_HEIGHT;
      state.camera.lookAt(lookAtPosition);

      // Calculate distance and adjust opacity
      const distance = state.camera.position.distanceTo(
        meshRef.current.position,
      );
      const maxDistance = 5; // Maximum distance for full opacity
      const minDistance = 2; // Minimum distance for full transparency
      const opacity = THREE.MathUtils.clamp(
        (distance - minDistance) / (maxDistance - minDistance),
        0.0,
        1,
      );

      if (meshRef.current.material instanceof THREE.MeshPhongMaterial) {
        meshRef.current.material.opacity = opacity;
        if (opacity < 0.1) {
          meshRef.current.visible = false;
        } else {
          meshRef.current.visible = true;
        }
      }
    }

    if (isDead) {
      removeComponent(entityId, ClientTransformComponent);
      removeComponent(entityId, TransformComponent);
      removeComponent(entityId, MoveTargetComponent);
    }

    if (spotlightRef.current && meshRef.current) {
      const direction = new THREE.Vector3(0, 0, 1);
      direction.applyQuaternion(meshRef.current.quaternion);
      spotlightRef.current.target.position.copy(
        meshRef.current.position.clone().add(direction),
      );
      spotlightRef.current.target.updateMatrixWorld();
    }
  });

  const getTargetPosition = useCallback(() => {
    if (combatTargetId) {
      const target = getEntity(combatTargetId);
      if (target) {
        const targetTransform = target.getComponent(ClientTransformComponent);
        if (targetTransform) {
          return targetTransform.position;
        }
        const targetServerTransform = target.getComponent(TransformComponent);
        return targetServerTransform?.position ?? null;
      }
    }
    if (mining) {
      return mining.positions[0];
    }
    return null;
  }, [combatTargetId, mining, getEntity]);

  return (
    <>
      <mesh
        name={`unit-${entityId}`}
        ref={meshRef}
        onClick={handleTarget}
        onContextMenu={handleAttack}
        castShadow
        receiveShadow>
        <boxGeometry args={[UNIT_WIDTH, UNIT_HEIGHT, UNIT_WIDTH]} />
        <meshPhongMaterial transparent color={color} />
        <Sky
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0}
          azimuth={0.25}
        />
      </mesh>
      {(combatTargetId || mining) && (
        <LightningBeam
          start={lightningBeamSourceRef.current}
          getEndPosition={getTargetPosition}
        />
      )}
    </>
  );
});

export default Unit;
