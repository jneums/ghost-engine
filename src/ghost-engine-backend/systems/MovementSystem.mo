import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Components "../components";
import Math "../math";

module {
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, deltaTime : Time.Time) : () {
    switch (ECS.World.getComponent(ctx, entityId, "PositionComponent"), ECS.World.getComponent(ctx, entityId, "TransformComponent")) {
      case (? #PositionComponent(position), ? #TransformComponent(transform)) {
        let defaultVelocity = 2.0;
        let deltaTimeSeconds = Float.fromInt(deltaTime) / 1_000_000_000.0; // Assuming deltaTime is in nanoseconds
        let velocity = defaultVelocity * deltaTimeSeconds;
        let epsilon = 1.0; // Threshold value

        // Calculate direction vector and normalize it
        let direction = {
          x = position.position.x - transform.position.x;
          y = position.position.y - transform.position.y;
          z = position.position.z - transform.position.z;
        };
        let normalizedDirection = Math.normalize(direction);

        // Calculate new position based on velocity and direction
        var newPosition = {
          x = transform.position.x + normalizedDirection.x * velocity;
          y = transform.position.y + normalizedDirection.y * velocity;
          z = transform.position.z + normalizedDirection.z * velocity;
        };

        // Check if the new position is within the threshold of the target position
        if (
          Float.abs(newPosition.x - position.position.x) < epsilon and
          Float.abs(newPosition.y - position.position.y) < epsilon and
          Float.abs(newPosition.z - position.position.z) < epsilon
        ) {
          // Snap to the target position
          newPosition := position.position;
          ECS.World.removeComponent(ctx, entityId, "PositionComponent");
        };

        // Calculate the new rotation to face the direction of movement
        let newYaw = Math.calculateYaw(normalizedDirection);
        let newRotationEuler = {
          x = transform.rotation.x;
          y = newYaw;
          z = transform.rotation.z;
        };

        // Convert Euler angles to quaternion
        let newRotationQuaternion = Math.eulerToQuaternion(newRotationEuler);

        let newTransform = #TransformComponent({
          scale = transform.scale;
          rotation = newRotationQuaternion;
          position = newPosition;
        });

        // Update the transform component
        ECS.World.addComponent(ctx, entityId, "TransformComponent", newTransform);
      };
      case (_) {};
    };
  };

  public let MovementSystem : ECS.Types.System<Components.Component> = {
    systemType = "MovementSystem";
    archetype = ["PrincipalComponent", "TransformComponent", "PositionComponent"];
    update = update;
  };
};
