import React, { useRef, useCallback, useState, useEffect } from 'react';
import { RootState, ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  MoveTargetComponent,
  TransformComponent,
  ClientTransformComponent,
  CombatComponent,
  HealthComponent,
  MiningComponent,
  PlaceBlockComponent,
  ClientMoveTargetComponent,
} from '../ecs/components';
import LightningBeam from './LightningBeam';
import { useWorld } from '../context/WorldProvider';
import useAction from '../hooks/useAction';
import { CAMERA_FOLLOW_DISTANCE } from '../const/camera';
import { updatePosition, smoothLookAt } from './utils';
import { UNIT_HEIGHT, UNIT_VELOCITY, UNIT_WIDTH } from '../const/units';
import { Shadow, Sky } from '@react-three/drei';
import useCameraControls from '../hooks/useCameraControls';
import useMovementPath from '../hooks/useMovementPath';

const raycaster = new THREE.Raycaster();
const cameraDirection = new THREE.Vector3();

const Unit = React.memo(function Unit({
  entityId,
  isUserControlled,
  model,
}: {
  entityId: number;
  isUserControlled?: boolean;
  model: THREE.Group;
}) {
  const { unitEntityId, getEntity, removeComponent } = useWorld();
  const { attack, setTarget } = useAction();
  const entity = getEntity(entityId);
  const [combatTargetId, setCombatTargetId] = useState<number | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const lightningBeamSourceRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const { zoomLevel, rotation } = useCameraControls();

  useMovementPath(entityId);

  if (!entity) return null;

  const serverTransform = entity.getComponent(TransformComponent);
  const clientMoveTarget = entity.getComponent(ClientMoveTargetComponent);
  let clientTransform = entity.getComponent(ClientTransformComponent);
  const combat = entity.getComponent(CombatComponent);
  const mining = entity.getComponent(MiningComponent);
  const place = entity.getComponent(PlaceBlockComponent);
  const health = entity.getComponent(HealthComponent);

  const isDead = health?.amount <= 0;

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
      if (unitEntityId === entityId) return;
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
      if (unitEntityId === entityId) return;
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
    setCombatTargetId(combat?.targetEntityId || null);
  }, [combat]);

  useEffect(() => {
    if (model) {
      modelRef.current = model.clone();
    }
  }, [model]);

  const updateModelPosition = (delta: number) => {
    if (!modelRef.current) return;

    let updatedPosition = clientTransform.position;
    if (clientMoveTarget) {
      updatedPosition = clientMoveTarget.waypoints[0];
    } else if (serverTransform.position != updatedPosition) {
      updatedPosition = serverTransform.position;
    }

    if (mining?.positions) {
      smoothLookAt(modelRef.current, mining.positions[0], delta);
    } else if (place?.positions) {
      smoothLookAt(modelRef.current, place.positions[0], delta);
    } else if (combatTargetId) {
      const target = getEntity(combatTargetId);
      const targetTransform = target?.getComponent(ClientTransformComponent);
      if (targetTransform) {
        smoothLookAt(modelRef.current, targetTransform.position, delta);
      }
    } else {
      smoothLookAt(modelRef.current, updatedPosition, delta);
    }

    updatePosition(
      clientTransform,
      updatedPosition,
      delta,
      UNIT_VELOCITY,
      0.05,
      clientMoveTarget,
    );

    const unitPosition = {
      x: clientTransform.position.x + 0.5 * UNIT_WIDTH,
      y: clientTransform.position.y + 0.75 * UNIT_HEIGHT,
      z: clientTransform.position.z + 0.5 * UNIT_WIDTH,
    };
    modelRef.current?.position.copy(unitPosition);
    lightningBeamSourceRef.current.copy(clientTransform.position);
    lightningBeamSourceRef.current.y += 0.6 * UNIT_HEIGHT;
  };

  const updateCameraPosition = (state: RootState) => {
    if (!modelRef.current) return;

    const radius = CAMERA_FOLLOW_DISTANCE * zoomLevel;
    const cameraOffset = new THREE.Vector3(
      radius * Math.sin(rotation.polar) * Math.sin(rotation.azimuthal),
      radius * Math.cos(rotation.polar),
      radius * Math.sin(rotation.polar) * Math.cos(rotation.azimuthal),
    );

    const desiredCameraPosition = modelRef.current.position
      .clone()
      .add(cameraOffset);

    cameraDirection
      .subVectors(desiredCameraPosition, modelRef.current.position)
      .normalize();
    raycaster.set(modelRef.current.position, cameraDirection);

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
        .subVectors(intersectionPoint, modelRef.current.position)
        .normalize();

      const safePosition = intersectionPoint
        .clone()
        .add(direction.multiplyScalar(0.1));

      const adjustedPosition = modelRef.current.position
        .clone()
        .lerp(safePosition, 0.7);

      state.camera.position.lerp(adjustedPosition, 0.8);
    } else {
      state.camera.position.copy(
        modelRef.current.position.clone().add(cameraOffset),
      );
    }

    state.camera.lookAt(modelRef.current.position.clone());
  };

  useFrame((state, delta) => {
    if (!modelRef.current) return;

    updateModelPosition(delta);

    const distance = state.camera.position.distanceTo(
      modelRef.current.position,
    );
    modelRef.current.visible = distance >= 2;

    if (isUserControlled) {
      updateCameraPosition(state);
    }

    if (isDead) {
      removeComponent(entityId, ClientTransformComponent);
      removeComponent(entityId, TransformComponent);
      removeComponent(entityId, MoveTargetComponent);
    }

    if (spotlightRef.current) {
      const direction = new THREE.Vector3(0, 0, 1);
      direction.applyQuaternion(modelRef.current.quaternion);
      spotlightRef.current.target.position.copy(
        modelRef.current.position.clone().add(direction),
      );
      spotlightRef.current.target.updateMatrixWorld();
    }
  });

  const getTargetPosition = useCallback(() => {
    if (combatTargetId) {
      const target = getEntity(combatTargetId);
      const targetTransform = target?.getComponent(ClientTransformComponent);
      if (targetTransform) {
        const position = targetTransform.position.clone();
        position.y += 0.6 * UNIT_HEIGHT;
        return position;
      }
      const targetServerTransform = target?.getComponent(TransformComponent);
      const position = targetServerTransform?.position.clone();
      if (position) {
        position.y += 0.6 * UNIT_HEIGHT;
        return position;
      }
      return targetServerTransform?.position;
    }
    return mining?.positions[0] || null;
  }, [combatTargetId, mining, getEntity]);

  if (!modelRef.current) return null;

  return (
    <>
      <group ref={groupRef}>
        <primitive
          scale={[0.5, 0.5, 0.5]}
          object={modelRef.current}
          castShadow
          onClick={handleTarget}
          onContextMenu={handleAttack}>
          <Shadow
            colorStop={0.5}
            position={[0, -1.5 * UNIT_HEIGHT + 0.01, 0]}
            fog
          />
        </primitive>
        <Sky
          distance={450000}
          sunPosition={[-30, 52.5, 30]}
          inclination={0}
          azimuth={0.25}
        />
      </group>
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
