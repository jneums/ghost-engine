import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Components "../components";
import Math "../math";

module {
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, deltaTime : Time.Time) : () {
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
        let nodeTransform = ECS.World.getComponent(ctx, combat.targetEntityId, "TransformComponent");
        let isInRange = switch (nodeTransform) {
          case (? #TransformComponent(nodeTransform)) {
            let distance = Math.distance(transform.position, nodeTransform.position);
            Debug.print("\nDistance: " # debug_show (distance));
            distance <= combat.range;
          };
          case (_) { false };
        };

        // If not in range, stop combat
        if (not isInRange) {
          Debug.print("\nCombat stopped, not in range: " # debug_show (isInRange));
          ECS.World.removeComponent(ctx, entityId, "CombatComponent");
          return;
        };

        // Check if the combat is complete
        let elapsedInSeconds = Float.fromInt(elapsedTime) / 1_000_000_000.0;
        Debug.print("\nElapsed time: " # debug_show (elapsedInSeconds));
        if (elapsedInSeconds >= combat.speed) {
          // Trigger damage application
          ECS.World.addComponent(ctx, combat.targetEntityId, "DamageComponent", #DamageComponent({ sourceEntityId = entityId; amount = 1 }));
          ECS.World.removeComponent(ctx, entityId, "CombatComponent");
        };
      };
      case (_) {};
    };
  };

  public let CombatSystem : ECS.Types.System<Components.Component> = {
    systemType = "CombatSystem";
    archetype = ["PrincipalComponent", "CombatComponent", "CargoComponent", "TransformComponent"];
    update = update;
  };
};
