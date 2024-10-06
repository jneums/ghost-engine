import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Components "../components";
import Vector3 "../math/Vector3";
import Quaternion "../math/Quaternion";
import Const "../utils/Const";
import Terrain "../utils/Terrain";

module {

  // Define a tag component for updating player chunks
  type UpdateChunksComponent = {};

  // Private function to calculate the new position
  private func calculateNewPosition(transform : Components.TransformComponent, position : Components.MoveTargetComponent, velocity : Float) : Vector3.Vector3 {
    let direction = {
      x = position.position.x - transform.position.x;
      y = position.position.y - transform.position.y;
      z = position.position.z - transform.position.z;
    };
    let normalizedDirection = Vector3.normalize(direction);

    {
      x = transform.position.x + normalizedDirection.x * velocity;
      y = transform.position.y + normalizedDirection.y * velocity;
      z = transform.position.z + normalizedDirection.z * velocity;
    };
  };

  // Private function to check if the entity has reached the target position
  private func hasReachedTarget(newPosition : Vector3.Vector3, targetPosition : Vector3.Vector3, epsilon : Float) : Bool {
    Float.abs(newPosition.x - targetPosition.x) < epsilon and Float.abs(newPosition.y - targetPosition.y) < epsilon and Float.abs(newPosition.z - targetPosition.z) < epsilon
  };

  // Private function to calculate the new rotation
  private func calculateNewRotation(transform : Components.TransformComponent, direction : Vector3.Vector3) : Quaternion.Quaternion {
    let newYaw = Vector3.calculateYaw(direction);
    let newRotationEuler = {
      x = transform.rotation.x;
      y = newYaw;
      z = transform.rotation.z;
    };
    Quaternion.eulerToQuaternion(newRotationEuler);
  };

  // Private function to handle movement logic
  private func handleMovement(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, position : Components.MoveTargetComponent, transform : Components.TransformComponent, deltaTime : Time.Time) {
    let defaultVelocity = 2.0;
    let deltaTimeSeconds = Float.fromInt(deltaTime) / 1_000_000_000.0; // Assuming deltaTime is in nanoseconds
    let velocity = defaultVelocity * deltaTimeSeconds;
    let epsilon = 1.0; // Threshold value

    var newPosition = calculateNewPosition(transform, position, velocity);

    if (hasReachedTarget(newPosition, position.position, epsilon)) {
      // Snap to the target position
      newPosition := position.position;
      ECS.World.removeComponent(ctx, entityId, "MoveTargetComponent");
    };

    let newRotationQuaternion = calculateNewRotation(transform, Vector3.normalize({ x = position.position.x - transform.position.x; y = position.position.y - transform.position.y; z = position.position.z - transform.position.z }));

    let newTransform = #TransformComponent({
      scale = transform.scale;
      rotation = newRotationQuaternion;
      position = newPosition;
    });

    // Update the transform component
    ECS.World.addComponent(ctx, entityId, "TransformComponent", newTransform);

    // Check if the player has crossed a chunk boundary
    let previousChunkPos = Terrain.getChunkPosition(transform.position);
    let currentChunkPos = Terrain.getChunkPosition(newPosition);

    if (currentChunkPos != previousChunkPos) {
      // Add the UpdateChunksComponent tag
      ECS.World.addComponent(ctx, entityId, "UpdateChunksComponent", #UpdateChunksComponent({}));
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
