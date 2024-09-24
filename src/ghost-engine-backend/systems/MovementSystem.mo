import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Components "../components";

module {
  func normalize(vector : { x : Float; y : Float; z : Float }) : {
    x : Float;
    y : Float;
    z : Float;
  } {
    let length = Float.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    return {
      x = vector.x / length;
      y = vector.y / length;
      z = vector.z / length;
    };
  };

  func calculateYaw(direction : { x : Float; y : Float; z : Float }) : Float {
    // Calculate yaw (rotation around the y-axis) based on the direction vector
    return Float.arctan2(direction.z, direction.x);
  };

  func eulerToQuaternion(euler : { x : Float; y : Float; z : Float }) : {
    x : Float;
    y : Float;
    z : Float;
    w : Float;
  } {
    let c1 = Float.cos(euler.y / 2.0);
    let c2 = Float.cos(euler.x / 2.0);
    let c3 = Float.cos(euler.z / 2.0);
    let s1 = Float.sin(euler.y / 2.0);
    let s2 = Float.sin(euler.x / 2.0);
    let s3 = Float.sin(euler.z / 2.0);

    return {
      x = s1 * s2 * c3 + c1 * c2 * s3;
      y = s1 * c2 * c3 + c1 * s2 * s3;
      z = c1 * s2 * c3 - s1 * c2 * s3;
      w = c1 * c2 * c3 - s1 * s2 * s3;
    };
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, deltaTime : Time.Time) : () {
    switch (ECS.World.getComponent(ctx, entityId, "PositionComponent"), ECS.World.getComponent(ctx, entityId, "TransformComponent")) {
      case (? #PositionComponent(position), ? #TransformComponent(transform)) {
        let defaultVelocity = 2.0;
        let deltaTimeSeconds = Float.fromInt(deltaTime) / 1_000_000_000.0; // Assuming deltaTime is in nanoseconds
        let velocity = defaultVelocity * deltaTimeSeconds;
        let epsilon = 1.0; // Threshold value

        Debug.print("\nEntity: " # debug_show (entityId) # "\nCurrent Position: " # debug_show (transform.position));
        Debug.print("Delta Time (seconds): " # debug_show (deltaTimeSeconds));
        Debug.print("Velocity: " # debug_show (velocity));

        // Calculate direction vector and normalize it
        let direction = {
          x = position.position.x - transform.position.x;
          y = position.position.y - transform.position.y;
          z = position.position.z - transform.position.z;
        };
        let normalizedDirection = normalize(direction);

        // Calculate new position based on velocity and direction
        var newPosition = {
          x = transform.position.x + normalizedDirection.x * velocity;
          y = transform.position.y + normalizedDirection.y * velocity;
          z = transform.position.z + normalizedDirection.z * velocity;
        };

        Debug.print("\nNew position: " # debug_show (newPosition));

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
        let newYaw = calculateYaw(normalizedDirection);
        let newRotationEuler = {
          x = transform.rotation.x;
          y = newYaw;
          z = transform.rotation.z;
        };

        // Convert Euler angles to quaternion
        let newRotationQuaternion = eulerToQuaternion(newRotationEuler);

        let newTransform = #TransformComponent({
          scale = transform.scale;
          rotation = newRotationQuaternion;
          position = newPosition;
        });

        // Update the transform component
        ECS.World.addComponent(ctx, entityId, "TransformComponent", newTransform);
      };
      case (_) {
        Debug.print("Entity: " # debug_show (entityId) # " Position: null");
      };
    };
  };

  public let MovementSystem : ECS.Types.System<Components.Component> = {
    systemType = "MovementSystem";
    archetype = ["PrincipalComponent", "TransformComponent", "PositionComponent"];
    update = update;
  };
};
