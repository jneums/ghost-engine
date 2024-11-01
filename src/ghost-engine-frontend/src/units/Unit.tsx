import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
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
import { UNIT_HEIGHT, UNIT_VELOCITY, UNIT_WIDTH } from '../const/units';

// Create a raycaster for collision detection
const raycaster = new THREE.Raycaster();
const cameraDirection = new THREE.Vector3();

const DAMPING_FACTOR = 0.5;

export default function Unit({
  entityId,
  isUserControlled,
}: {
  entityId: number;
  isUserControlled?: boolean;
}) {
  const { gl } = useThree();
  const { unitEntityId, getEntity, removeComponent } = useWorld();
  const { attack, setTarget } = useAction();
  const entity = getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const lightningBeamSourceRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const [combatTargetId, setCombatTargetId] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({
    azimuthal: 0,
    polar: Math.PI / 4,
  });
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [initialPinchDistance, setInitialPinchDistance] = useState<
    number | null
  >(null);

  const velocity = UNIT_VELOCITY; // units per second
  const epsilon = 0.05; // Small value to prevent shaking

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
    [unitEntityId, entityId],
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
      if (event.button === 0) {
        setIsDragging(true);
      }
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

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        setIsDragging(true);
        setLastTouch({
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        });
      } else if (event.touches.length === 2) {
        event.preventDefault(); // Prevent default touch behavior
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2),
        );
        setInitialPinchDistance(distance);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isDragging && event.touches.length === 1 && lastTouch) {
        event.preventDefault(); // Prevent default touch behavior
        const touch = event.touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        setRotation((prevRotation) => ({
          azimuthal: prevRotation.azimuthal - deltaX * 0.01,
          polar: Math.max(
            0.1,
            Math.min(Math.PI - 0.1, prevRotation.polar - deltaY * 0.01),
          ), // Invert Y-axis
        }));
        setLastTouch({ x: touch.clientX, y: touch.clientY });
      } else if (event.touches.length === 2 && initialPinchDistance !== null) {
        event.preventDefault(); // Prevent default touch behavior
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2),
        );
        const zoomChange = (distance - initialPinchDistance) * 0.005;
        setZoomLevel((prevZoom) =>
          Math.max(0.5, Math.min(5, prevZoom - zoomChange)),
        );
        setInitialPinchDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setLastTouch(null);
      setInitialPinchDistance(null);
    };

    gl.domElement.addEventListener('wheel', handleWheel);
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('mouseup', handleMouseUp);
    gl.domElement.addEventListener('touchstart', handleTouchStart);
    gl.domElement.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    gl.domElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      gl.domElement.removeEventListener('wheel', handleWheel);
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('mouseup', handleMouseUp);
      gl.domElement.removeEventListener('touchstart', handleTouchStart);
      gl.domElement.removeEventListener('touchmove', handleTouchMove);
      gl.domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, lastTouch, initialPinchDistance, gl.domElement]);

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
      if (mining && mining.positions) {
        // Smoothly look at the mining target
        smoothLookAt(meshRef.current, mining.positions[0], delta);
      } else {
        // Smoothly look at the movement target
        smoothLookAt(meshRef.current, updatedPosition, delta);
      }
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
        radius * Math.cos(rotation.polar),
        radius * Math.sin(rotation.polar) * Math.cos(rotation.azimuthal),
      );

      // Calculate the desired camera position
      const desiredCameraPosition = meshRef.current.position
        .clone()
        .add(cameraOffset);

      // Set the raycaster to check for collisions
      cameraDirection
        .subVectors(desiredCameraPosition, meshRef.current.position)
        .normalize();
      raycaster.set(meshRef.current.position, cameraDirection);

      // Calculate the maximum range for the raycast
      const bufferDistance = 0.5; // Adjust this buffer as needed
      const maxRaycastDistance =
        CAMERA_FOLLOW_DISTANCE * zoomLevel + bufferDistance;
      raycaster.far = maxRaycastDistance;

      // Find the closest intersection using reduce
      const closestIntersection = state.scene.children
        .filter((child) => child.name.startsWith('chunk'))
        .flatMap((child) => raycaster.intersectObject(child, true))
        .reduce<THREE.Intersection | null>((closest, intersect) => {
          if (!closest || intersect.distance < closest.distance) {
            return intersect;
          }
          return closest;
        }, null);

      // Adjust the camera position to avoid clipping
      const minDistance = 0.0; // Minimum distance from the player
      if (closestIntersection) {
        const intersectionPoint = closestIntersection.point;
        const distanceToPlayer = intersectionPoint.distanceTo(
          meshRef.current.position,
        );
        if (distanceToPlayer < minDistance) {
          // If the intersection is too close, adjust to maintain minDistance
          const direction = new THREE.Vector3()
            .subVectors(intersectionPoint, meshRef.current.position)
            .normalize();
          const adjustedPosition = meshRef.current.position
            .clone()
            .add(direction.multiplyScalar(minDistance));
          state.camera.position.lerp(adjustedPosition, DAMPING_FACTOR); // Damping factor
        } else {
          // Use the intersection point directly
          state.camera.position.lerp(intersectionPoint, DAMPING_FACTOR); // Damping factor
        }
      } else {
        state.camera.position.copy(
          meshRef.current.position.clone().add(cameraOffset),
        );
      }

      state.camera.lookAt(meshRef.current.position);
    }

    if (isDead) {
      removeComponent(entityId, ClientTransformComponent);
      removeComponent(entityId, TransformComponent);
      removeComponent(entityId, MoveTargetComponent);
    }

    // Update spotlight direction
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
  }, [combatTargetId, mining]);

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
        <meshPhongMaterial color={color} />
        {isUserControlled && (
          <spotLight
            ref={spotlightRef}
            position={[0, 0.6 * UNIT_HEIGHT, 0.7 * UNIT_WIDTH]} // Slightly in front of the unit
            angle={Math.PI / 2}
            penumbra={0.2}
            intensity={1}
            castShadow
          />
        )}
      </mesh>
      {(combatTargetId || mining) && (
        <LightningBeam
          start={lightningBeamSourceRef.current}
          getEndPosition={getTargetPosition}
        />
      )}
    </>
  );
}
