import * as THREE from 'three';
import { System } from '.';
import {
  ClientTransformComponent,
  PositionComponent,
  TransformComponent,
} from '../components';
import { World, EntityId } from '../ecs';

function normalize(vector: THREE.Vector3): THREE.Vector3 {
  const length = vector.length();
  if (length === 0) {
    return new THREE.Vector3(0, 0, 0);
  }
  return new THREE.Vector3(
    vector.x / length,
    vector.y / length,
    vector.z / length,
  );
}

function calculateYaw(direction: THREE.Vector3): number {
  // Calculate yaw (rotation around the y-axis) based on the direction vector
  return Math.atan2(direction.z, direction.x);
}

export class MovementSystem implements System {
  public componentsRequired = new Set([TransformComponent]);
  public ecs: World | null = null;

  // State to track the current client transform for each entity
  private clientTransforms: Map<EntityId, ClientTransformComponent> = new Map();

  public update(entities: Set<EntityId>, deltaTime: number) {
    if (!this.ecs) {
      console.error('ECS is not initialized');
      return;
    }

    const defaultVelocity = 2.0;
    const deltaTimeSeconds = deltaTime / 1000; // Assuming deltaTime is in ms
    const velocity = defaultVelocity * deltaTimeSeconds;
    const epsilon = 0.02;

    for (const entityId of entities) {
      const entity = this.ecs.getEntity(entityId);

      const positionComponent = entity.getComponent(PositionComponent);
      const transformComponent = entity.getComponent(TransformComponent);

      if (!transformComponent) {
        continue;
      }

      const position = positionComponent
        ? positionComponent.position
        : transformComponent.position;
      let clientTransform = this.clientTransforms.get(entityId);

      if (!clientTransform) {
        clientTransform = transformComponent;
        this.clientTransforms.set(entityId, clientTransform);
      }

      // Calculate direction vector and normalize it
      const direction = new THREE.Vector3(
        position.x - clientTransform.position.x,
        position.y - clientTransform.position.y,
        position.z - clientTransform.position.z,
      );

      if (direction.length() === 0) {
        continue;
      }

      const normalizedDirection = normalize(direction);

      // Calculate new position based on velocity and direction
      let newPosition: THREE.Vector3 = new THREE.Vector3(
        clientTransform.position.x + normalizedDirection.x * velocity,
        clientTransform.position.y + normalizedDirection.y * velocity,
        clientTransform.position.z + normalizedDirection.z * velocity,
      );

      // Check if the new position is within the threshold of the target position
      if (
        Math.abs(newPosition.x - position.x) < epsilon &&
        Math.abs(newPosition.y - position.y) < epsilon &&
        Math.abs(newPosition.z - position.z) < epsilon
      ) {
        // Snap to the target position
        newPosition = position;
      }

      // Calculate the new rotation to face the direction of movement
      const newYaw = calculateYaw(normalizedDirection);
      const newRotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, newYaw, 0),
      );

      // Update the client transform state
      clientTransform.position.copy(newPosition);
      clientTransform.rotation.copy(newRotation);
      this.clientTransforms.set(entityId, clientTransform);

      // Create or update the ClientTransformComponent
      let clientTransformComponent = entity.getComponent(
        ClientTransformComponent,
      );
      if (!clientTransformComponent) {
        clientTransformComponent = new ClientTransformComponent(
          clientTransform.position.clone(),
          clientTransform.rotation.clone(),
          clientTransform.scale.clone(),
        );
        entity.addComponent(clientTransformComponent);
      }
      clientTransformComponent.position.copy(newPosition);
      clientTransformComponent.rotation.copy(newRotation);
    }
  }
}
