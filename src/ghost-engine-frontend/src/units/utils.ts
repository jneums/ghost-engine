import * as THREE from 'three';
import { TransformComponent, MoveTargetComponent } from '../ecs/components';

export function updatePosition(
  clientTransform: TransformComponent,
  targetPosition: THREE.Vector3,
  delta: number,
  velocity: number,
  epsilon: number,
  moveTarget: MoveTargetComponent | undefined,
) {
  if (!targetPosition) return;
  const direction = new THREE.Vector3();

  // Calculate the direction vector towards the target
  direction.subVectors(targetPosition, clientTransform.position).normalize();

  // Calculate the distance to move this frame
  const distance = velocity * delta;

  // Calculate the remaining distance to the target
  const distanceToTarget = clientTransform.position.distanceTo(targetPosition);

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
    }
  }
}

export function updateCamera(
  camera: THREE.Camera,
  targetPosition: THREE.Vector3,
  delta: number,
  meshRef: React.RefObject<THREE.Mesh>,
  CAMERA_HEIGHT: number,
  CAMERA_FOLLOW_DISTANCE: number,
) {
  // Calculate the desired camera position based on the unit's position and rotation
  const offset = new THREE.Vector3(0, CAMERA_HEIGHT, -CAMERA_FOLLOW_DISTANCE);
  offset.applyQuaternion(meshRef.current?.quaternion || new THREE.Quaternion());

  const desiredPosition = targetPosition.clone().add(offset);

  // Smoothly interpolate the camera's position
  camera.position.lerp(desiredPosition, delta * 0.5); // Adjust the factor for smoothness

  // Ensure the camera is looking at the unit
  const lookAtTarget = targetPosition.clone();
  lookAtTarget.y += 2; // Adjust to look slightly above the unit

  camera.lookAt(lookAtTarget);
}

export function smoothLookAt(
  object: THREE.Object3D,
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
    object.position,
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
    object.quaternion.slerp(targetQuaternion, delta * 10); // Adjust the factor for smoothness
  }
}
