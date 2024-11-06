import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Components "../components";
import Vector3 "../math/Vector3";
import Quaternion "../math/Quaternion";
import Const "../utils/Const";
import Blocks "../utils/Blocks";
import TokenRegistry "../utils/TokenRegistry";

module {
  // Function to check if a block is valid to stand on
  private func isBlockValid(ctx : ECS.Types.Context<Components.Component>, position : Vector3.Vector3) : Bool {
    let aboveBlock = Blocks.getBlockType(ctx, { x = position.x; y = position.y + 1.0; z = position.z });
    let currentBlock = Blocks.getBlockType(ctx, position);
    let belowBlock = Blocks.getBlockType(ctx, { x = position.x; y = position.y - 1.0; z = position.z });

    let airWithSolidUnderneath = aboveBlock == TokenRegistry.BlockType.Air and currentBlock == TokenRegistry.BlockType.Air and belowBlock != TokenRegistry.BlockType.Air and belowBlock != TokenRegistry.BlockType.Water;
    let waterWithSolidUnderneath = aboveBlock == TokenRegistry.BlockType.Air and currentBlock == TokenRegistry.BlockType.Water and (belowBlock != TokenRegistry.BlockType.Air);

    airWithSolidUnderneath or waterWithSolidUnderneath;
  };

  // Private function to check if two positions are adjacent
  private func areAdjacent(pos1 : Vector3.Vector3, pos2 : Vector3.Vector3) : Bool {
    let dx = Float.abs(pos1.x - pos2.x);
    let dy = Float.abs(pos1.y - pos2.y);
    let dz = Float.abs(pos1.z - pos2.z);
    dx <= 5.0 and dy <= 5.0 and dz <= 5.0;
  };

  private func handleMovement(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, moveTarget : Components.MoveTargetComponent, transform : Components.TransformComponent, deltaTime : Time.Time) {
    let defaultVelocity = Const.UNIT_VELOCITY;
    let deltaTimeSeconds = Float.fromInt(deltaTime) / 1_000_000_000.0; // Assuming deltaTime is in nanoseconds
    var remainingDistance = defaultVelocity * deltaTimeSeconds;

    // Iterate over waypoints as long as there is remaining distance to move
    var currentPosition = transform.position;
    var waypoints = moveTarget.waypoints;

    while (remainingDistance > 0.0 and waypoints.size() > 0) {
      let targetPosition = waypoints[0];

      // Check if the target position is adjacent to the current position
      if (not areAdjacent(currentPosition, targetPosition)) {
        Debug.print("Invalid movement: target position is not adjacent to current position");
        ECS.World.removeComponent(ctx, entityId, "MoveTargetComponent");
        return;
      };

      // Check if the target position is a valid block
      if (not isBlockValid(ctx, targetPosition)) {
        Debug.print("Invalid block to stand on at position: " # debug_show (targetPosition));
        ECS.World.removeComponent(ctx, entityId, "MoveTargetComponent");
        return;
      };

      let direction = {
        x = targetPosition.x - currentPosition.x;
        y = targetPosition.y - currentPosition.y;
        z = targetPosition.z - currentPosition.z;
      };
      let distanceToTarget = Vector3.magnitude(direction);
      let normalizedDirection = Vector3.normalize(direction);

      if (distanceToTarget <= remainingDistance) {
        // Move to the target position
        currentPosition := targetPosition;
        remainingDistance := remainingDistance - distanceToTarget;
        // Remove the reached waypoint
        waypoints := Array.subArray(waypoints, 1, waypoints.size() - 1 : Nat);
      } else {
        // Move as far as possible towards the target
        currentPosition := {
          x = currentPosition.x + normalizedDirection.x * remainingDistance;
          y = currentPosition.y + normalizedDirection.y * remainingDistance;
          z = currentPosition.z + normalizedDirection.z * remainingDistance;
        };
        remainingDistance := 0.0;
      };
    };

    let newTransform = #TransformComponent({
      scale = transform.scale;
      rotation = Quaternion.zero();
      position = currentPosition;
    });

    // Update the transform component
    ECS.World.addComponent(ctx, entityId, "TransformComponent", newTransform);

    // Check if the unit has crossed a chunk boundary
    let previousChunkPos = Blocks.getChunkPosition(transform.position);
    let currentChunkPos = Blocks.getChunkPosition(currentPosition);

    if (currentChunkPos != previousChunkPos) {
      // Add the UpdateUnitChunksComponent tag
      ECS.World.addComponent(ctx, entityId, "UpdateUnitChunksComponent", #UpdateUnitChunksComponent({}));
    };

    if (waypoints.size() > 0) {
      // Update the waypoints in the component
      let newMoveTarget = #MoveTargetComponent({
        waypoints = waypoints;
      });
      ECS.World.addComponent(ctx, entityId, "MoveTargetComponent", newMoveTarget);
    } else {
      // Remove the MoveTargetComponent
      ECS.World.removeComponent(ctx, entityId, "MoveTargetComponent");
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
