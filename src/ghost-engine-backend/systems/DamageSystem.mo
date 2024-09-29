import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";

module {
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : () {
    switch (
      ECS.World.getComponent(ctx, entityId, "DamageComponent"),
      ECS.World.getComponent(ctx, entityId, "CargoComponent"),
      ECS.World.getComponent(ctx, entityId, "HealthComponent"),
    ) {
      case (
        ? #DamageComponent(damage),
        ? #CargoComponent(cargo),
        ? #HealthComponent(health),
      ) {
        // Update the target's health
        let hasDied = damage.amount >= health.amount;
        let newHealth = #HealthComponent({
          amount = if (hasDied) 0 else health.amount - damage.amount : Nat;
          max = health.max;
        });
        ECS.World.addComponent(ctx, entityId, "HealthComponent", newHealth);

        if (hasDied) {
          // Get the source entity's cargo
          let sourceCargo = ECS.World.getComponent(ctx, damage.sourceEntityId, "CargoComponent");
          let newSourceCargo = switch (sourceCargo) {
            case (? #CargoComponent(sourceCargo)) {
              let current = if (sourceCargo.current + cargo.current > sourceCargo.capacity) {
                sourceCargo.capacity;
              } else {
                sourceCargo.current + cargo.current;
              };

              #CargoComponent({
                capacity = sourceCargo.capacity;
                current = current;
              });
            };
            case (_) {
              #CargoComponent({
                capacity = 100;
                current = cargo.current;
              });
            };
          };
          ECS.World.addComponent(ctx, damage.sourceEntityId, "CargoComponent", newSourceCargo);

          // Reset the target's cargo
          ECS.World.addComponent(ctx, entityId, "CargoComponent", #CargoComponent({ capacity = cargo.capacity; current = 0 }));

          // If the entity has a resource component, create a respawn timer
          switch (ECS.World.getComponent(ctx, entityId, "ResourceComponent")) {
            case (? #ResourceComponent(_)) {
              let respawn = #RespawnComponent({
                deathTime = Time.now();
                duration = 3 * 60 * 1_000_000_000;
              });
              ECS.World.addComponent(ctx, entityId, "RespawnComponent", respawn);
            };
            case (_) {};
          };
        };

        // Remove the damage component after applying damage
        ECS.World.removeComponent(ctx, entityId, "DamageComponent");
      };
      case (_) {};
    };
  };

  public let DamageSystem : ECS.Types.System<Components.Component> = {
    systemType = "DamageSystem";
    archetype = ["DamageComponent", "CargoComponent", "HealthComponent"];
    update = update;
  };
};
