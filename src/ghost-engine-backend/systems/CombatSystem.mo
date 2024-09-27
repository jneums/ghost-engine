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
      ECS.World.getComponent(ctx, entityId, "CargoComponent"),
      ECS.World.getComponent(ctx, entityId, "PrincipalComponent"),
      ECS.World.getComponent(ctx, entityId, "TransformComponent"),
    ) {
      case (
        ? #CombatComponent(combat),
        ? #CargoComponent(cargo),
        ? #PrincipalComponent(principal),
        ? #TransformComponent(transform),
      ) {
        // Calculate the time elapsed since the combat started
        let currentTime = Time.now();
        let elapsedTime = currentTime - combat.startAt;

        // Range check (must be within range of the target)
        // Get the node by entityId and find its transform.position
        let nodeTransform = ECS.World.getComponent(ctx, combat.targetEntityId, "TransformComponent");
        let isInRange = switch (nodeTransform) {
          case (? #TransformComponent(nodeTransform)) {
            let distance = Math.distance(transform.position, nodeTransform.position);

            Debug.print("\nDistance: " # debug_show (distance));

            distance <= combat.range;
          };
          case (_) { false };
        };

        // Check if the player has enough cargo space
        let hasCargoSpace = cargo.current < cargo.capacity;

        // If not in range, stop combat
        if (not isInRange or not hasCargoSpace) {
          Debug.print("\nCombat stopped: " # debug_show (isInRange) # " " # debug_show (hasCargoSpace));
          ECS.World.removeComponent(ctx, entityId, "CombatComponent");
          return;
        };

        // Check if the combat is complete
        let elapsedInSeconds = Float.fromInt(elapsedTime) / 1_000_000_000.0;
        Debug.print("\nElapsed time: " # debug_show (elapsedInSeconds));
        if (elapsedInSeconds >= combat.speed) {
          // Update the players health
          let targetHealth = ECS.World.getComponent(ctx, combat.targetEntityId, "HealthComponent");
          let (newHealth, hasDied) = switch (targetHealth) {
            case (? #HealthComponent(component)) {
              let health = if (+component.health - 1 < 0) 0 else component.health - 1 : Nat;
              (#HealthComponent({ health = health; maxHealth = component.maxHealth }), component.health == 0);
            };
            case (_) {
              (#HealthComponent({ health = 0; maxHealth = 0 }), true);

            };
          };

          ECS.World.addComponent(ctx, combat.targetEntityId, "HealthComponent", newHealth);

          if (hasDied) {

            // Add the targets cargo to the player
            let targetCargo = ECS.World.getComponent(ctx, combat.targetEntityId, "CargoComponent");
            let newCargo = switch (targetCargo) {
              case (? #CargoComponent(targetCargo)) {
                #CargoComponent({
                  capacity = cargo.capacity;
                  current = cargo.current + targetCargo.current;
                });
              };
              case (_) {
                #CargoComponent({
                  capacity = cargo.capacity;
                  current = cargo.current + 1;
                });
              };
            };

            ECS.World.addComponent(ctx, entityId, "CargoComponent", newCargo);

            // Remove the targets cargo

            ECS.World.removeComponent(ctx, entityId, "CombatComponent");

            // Remove the node
            ECS.World.removeComponent(ctx, combat.targetEntityId, "TransformComponent");
          };
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
