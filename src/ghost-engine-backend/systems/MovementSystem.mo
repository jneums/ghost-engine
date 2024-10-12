import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Components "../components";
import Vector3 "../math/Vector3";
import Quaternion "../math/Quaternion";
import Const "../utils/Const";
import Chunks "../utils/Chunks";

module {
  // Private function to check if the entity has reached the target position
  private func hasReachedTarget(newPosition : Vector3.Vector3, targetPosition : Vector3.Vector3, epsilon : Float) : Bool {
    Float.abs(newPosition.x - targetPosition.x) < epsilon and Float.abs(newPosition.y - targetPosition.y) < epsilon and Float.abs(newPosition.z - targetPosition.z) < epsilon
  };

  private func handleMovement(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, position : Components.MoveTargetComponent, transform : Components.TransformComponent, deltaTime : Time.Time) {
    let defaultVelocity = 2.0;
    let deltaTimeSeconds = Float.fromInt(deltaTime) / 1_000_000_000.0; // Assuming deltaTime is in nanoseconds
    let velocity = defaultVelocity * deltaTimeSeconds;
    let epsilon = 0.01; // Smaller threshold value for precision

    let direction = {
      x = position.position.x - transform.position.x;
      y = position.position.y - transform.position.y;
      z = position.position.z - transform.position.z;
    };
    let distanceToTarget = Vector3.magnitude(direction);
    let normalizedDirection = Vector3.normalize(direction);

    // Calculate potential new position
    var potentialNewPosition = {
      x = transform.position.x + normalizedDirection.x * velocity;
      y = transform.position.y + normalizedDirection.y * velocity;
      z = transform.position.z + normalizedDirection.z * velocity;
    };

    // Check if the potential new position overshoots the target
    if (distanceToTarget <= velocity or hasReachedTarget(potentialNewPosition, position.position, epsilon)) {
      // Snap to the target position
      potentialNewPosition := position.position;
      ECS.World.removeComponent(ctx, entityId, "MoveTargetComponent");
    };

    let newTransform = #TransformComponent({
      scale = transform.scale;
      rotation = Quaternion.zero();
      position = potentialNewPosition;
    });

    // Update the transform component
    ECS.World.addComponent(ctx, entityId, "TransformComponent", newTransform);

    // Check if the player has crossed a chunk boundary
    let previousChunkPos = Chunks.getChunkPosition(transform.position);
    let currentChunkPos = Chunks.getChunkPosition(potentialNewPosition);

    if (currentChunkPos != previousChunkPos) {
      // Add the UpdatePlayerChunksComponent tag
      ECS.World.addComponent(ctx, entityId, "UpdatePlayerChunksComponent", #UpdatePlayerChunksComponent({}));
    };
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, deltaTime : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "MoveTargetComponent"), ECS.World.getComponent(ctx, entityId, "TransformComponent")) {
      case (? #MoveTargetComponent(position), ? #TransformComponent(transform)) {
        handleMovement(ctx, entityId, position, transform, deltaTime);
      };
      case (_) {};
    };
  };

  public let MovementSystem : ECS.Types.System<Components.Component> = {
    systemType = "MovementSystem";
    archetype = ["TransformComponent", "MoveTargetComponent"];
    update = update;
  };
};
