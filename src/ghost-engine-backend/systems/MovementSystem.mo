import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
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

  private func handleMovement(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, moveTarget : Components.MoveTargetComponent, transform : Components.TransformComponent, deltaTime : Time.Time) {
    let defaultVelocity = Const.UNIT_VELOCITY;
    let deltaTimeSeconds = Float.fromInt(deltaTime) / 1_000_000_000.0; // Assuming deltaTime is in nanoseconds
    let velocity = defaultVelocity * deltaTimeSeconds;
    let epsilon = 0.01; // Smaller threshold value for precision

    // Check if there are waypoints to process
    if (moveTarget.waypoints.size() == 0) {
      // No waypoints left, remove the component
      ECS.World.removeComponent(ctx, entityId, "MoveTargetComponent");
      return;
    };

    // Get the current target waypoint
    let targetPosition = moveTarget.waypoints[0];
    Debug.print("\nMoving to waypoint: " # debug_show (targetPosition));

    let direction = {
      x = targetPosition.x - transform.position.x;
      y = targetPosition.y - transform.position.y;
      z = targetPosition.z - transform.position.z;
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
    if (distanceToTarget <= velocity or hasReachedTarget(potentialNewPosition, targetPosition, epsilon)) {
      // Snap to the target position
      potentialNewPosition := targetPosition;
      // Remove the reached waypoint
      if (moveTarget.waypoints.size() > 0) {
        let updatedWaypoints = Array.subArray(moveTarget.waypoints, 1, moveTarget.waypoints.size() - 1 : Nat);
        let newMoveTarget = #MoveTargetComponent({
          waypoints = updatedWaypoints;
        });
        ECS.World.addComponent(ctx, entityId, "MoveTargetComponent", newMoveTarget);
      } else {
        // No waypoints left, remove the component
        ECS.World.removeComponent(ctx, entityId, "MoveTargetComponent");
      };
    };

    let newTransform = #TransformComponent({
      scale = transform.scale;
      rotation = Quaternion.zero();
      position = potentialNewPosition;
    });

    // Update the transform component
    ECS.World.addComponent(ctx, entityId, "TransformComponent", newTransform);

    // Check if the unit has crossed a chunk boundary
    let previousChunkPos = Chunks.getChunkPosition(transform.position);
    let currentChunkPos = Chunks.getChunkPosition(potentialNewPosition);

    if (currentChunkPos != previousChunkPos) {
      // Add the UpdateUnitChunksComponent tag
      ECS.World.addComponent(ctx, entityId, "UpdateUnitChunksComponent", #UpdateUnitChunksComponent({}));
    };
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, deltaTime : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "MoveTargetComponent"), ECS.World.getComponent(ctx, entityId, "TransformComponent")) {
      case (? #MoveTargetComponent(moveTarget), ? #TransformComponent(transform)) {
        handleMovement(ctx, entityId, moveTarget, transform, deltaTime);
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
