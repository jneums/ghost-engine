import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  MoveTargetComponent,
  TransformComponent,
  ClientTransformComponent,
  CombatComponent,
  HealthComponent,
  MiningComponent,
} from '../ecs/components';
import * as THREE from 'three';
import { useRef, useEffect, useState, useCallback } from 'react';
import LightningBeam from './LightningBeam';
import { useWorld } from '../context/WorldProvider';
import useAction from '../hooks/useAction';
import { CAMERA_FOLLOW_DISTANCE } from '../const/camera';
import { updatePosition, smoothLookAt } from './utils';
import { UNIT_HEIGHT, UNIT_WIDTH } from '../const/units';

export default function Unit({
  entityId,
  isUserControlled,
}: {
  entityId: number;
  isUserControlled?: boolean;
}) {
  const { unitEntityId, getEntity, removeComponent } = useWorld();
  const { attack, setTarget } = useAction();
  const entity = getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const [combatTargetId, setCombatTargetId] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({
    azimuthal: 0,
    polar: Math.PI / 4,
  });

  const velocity = 1.5; // units per second
  const epsilon = 0.05; // Small value to prevent shaking

  if (!entity) return null;

  const serverTransform = entity.getComponent(TransformComponent);
  const moveTarget = entity.getComponent(MoveTargetComponent);
  let clientTransform = entity.getComponent(ClientTransformComponent);
  const combat = entity.getComponent(CombatComponent);
  const mining = entity.getComponent(MiningComponent);
  const health = entity.getComponent(HealthComponent);

  const isDead = health.amount <= 0;
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
      event.stopPropagation();
      if (!unitEntityId) {
        console.error('Player entity not found');
        return;
      }

      setTarget(unitEntityId, entityId);
    },
    [unitEntityId, entityId],
  );

  const handleAttack = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (!unitEntityId) {
        console.error('Player entity not found');
        return;
      }

      setTarget(unitEntityId, entityId);
      attack(unitEntityId, entityId);
    },
    [unitEntityId, entityId],
  );

  useEffect(() => {
    if (combat) {
      setCombatTargetId(combat.targetEntityId);
    } else {
      setCombatTargetId(null);
    }
  }, [combat]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      setZoomLevel((prevZoom) =>
        Math.max(0.5, Math.min(5, prevZoom + event.deltaY * 0.001)),
      );
    };

    const handleMouseDown = (event: MouseEvent) => {
      setIsDragging(true);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        setRotation((prevRotation) => ({
          azimuthal: prevRotation.azimuthal - event.movementX * 0.01,
          polar: Math.max(
            0.1,
            Math.min(
              Math.PI - 0.1,
              prevRotation.polar - event.movementY * 0.01,
            ),
          ), // Invert Y-axis
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useFrame((state, delta) => {
    let updatedPosition = clientTransform.position;
    if (isUserControlled && moveTarget && moveTarget.waypoints.length > 0) {
      updatedPosition = moveTarget.waypoints[0];
    }
    if (!isUserControlled && serverTransform) {
      updatedPosition = serverTransform.position;
    }

    // Smoothly rotate the mesh to face the direction of movement
    if (meshRef.current) {
      smoothLookAt(meshRef.current, updatedPosition, delta);
    }

    // Start moving towards the target
    updatePosition(
      clientTransform,
      updatedPosition,
      delta,
      velocity,
      epsilon,
      moveTarget,
      removeComponent,
      entityId,
    );

    const unitPosition = {
      x: clientTransform.position.x + 0.5 * UNIT_WIDTH,
      y: clientTransform.position.y + 0.5 * UNIT_HEIGHT + 0.01,
      z: clientTransform.position.z + 0.5 * UNIT_WIDTH,
    };
    meshRef.current?.position.copy(unitPosition);

    if (isUserControlled && meshRef.current) {
      const radius = CAMERA_FOLLOW_DISTANCE * zoomLevel;
      const cameraOffset = new THREE.Vector3(
        radius * Math.sin(rotation.polar) * Math.sin(rotation.azimuthal),
        radius * Math.cos(rotation.polar),
        radius * Math.sin(rotation.polar) * Math.cos(rotation.azimuthal),
      );
      state.camera.position.copy(
        meshRef.current.position.clone().add(cameraOffset),
      );
      state.camera.lookAt(meshRef.current.position);
    }

    if (isDead) {
      removeComponent(entityId, ClientTransformComponent);
      removeComponent(entityId, TransformComponent);
      removeComponent(entityId, MoveTargetComponent);
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
      return mining.position;
    }
    return null;
  }, [combatTargetId, mining]);

  const name = entityId.toString();

  return (
    <>
      <mesh
        name={name}
        ref={meshRef}
        onClick={handleTarget}
        onContextMenu={handleAttack}
        castShadow
        receiveShadow>
        <boxGeometry args={[UNIT_WIDTH, UNIT_HEIGHT, UNIT_WIDTH]} />
        <meshPhongMaterial color={color} />
      </mesh>
      {(combatTargetId || mining) && (
        <LightningBeam
          start={clientTransform.position}
          getEndPosition={getTargetPosition}
        />
      )}
    </>
  );
}
