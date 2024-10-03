import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Components "../components";
import Math "../math";

module {
  // Constant for nanoseconds to seconds conversion
  let NANOS_PER_SECOND = 1_000_000_000.0;

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "CombatComponent"),
      ECS.World.getComponent(ctx, entityId, "TransformComponent"),
    ) {
      case (
        ? #CombatComponent(combat),
        ? #TransformComponent(transform),
      ) {
        // Calculate the time elapsed since the combat started
        let currentTime = Time.now();
        let elapsedTime = currentTime - combat.startAt;

        // Range check (must be within range of the target)
        let targetTransform = ECS.World.getComponent(ctx, combat.targetEntityId, "TransformComponent");
        let isInRange = switch (targetTransform) {
          case (? #TransformComponent(targetTransform)) {
            let distance = Math.distance(transform.position, targetTransform.position);
            distance <= combat.range;
          };
          case (_) { false };
        };

        // If not in range, stop combat
        if (not isInRange) {
          ECS.World.removeComponent(ctx, entityId, "CombatComponent");
          return;
        };

        // Check if the combat is complete
        let elapsedInSeconds = Float.fromInt(elapsedTime) / NANOS_PER_SECOND;
        if (elapsedInSeconds >= combat.speed) {
          // Trigger damage application
          ECS.World.addComponent(ctx, combat.targetEntityId, "DamageComponent", #DamageComponent({ sourceEntityId = entityId; amount = 1 }));
        };
      };
      case (_) {};
    };
  };

  public let CombatSystem : ECS.Types.System<Components.Component> = {
    systemType = "CombatSystem";
    archetype = ["CombatComponent", "TransformComponent"];
    update = update;
  };
};
