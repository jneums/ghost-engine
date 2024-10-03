import ECS "mo:geecs";
import Time "mo:base/Time";
import Option "mo:base/Option";
import Components "../components";
import Tokens "../utils/Tokens";

module {

  // Private function to update health and determine if the entity has died
  private func updateHealth(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, damage : Components.DamageComponent, health : Components.HealthComponent) : Bool {
    let hasDied = damage.amount >= health.amount;
    let newHealth = #HealthComponent({
      amount = if (hasDied) 0 else health.amount - damage.amount : Nat;
      max = health.max;
    });
    ECS.World.addComponent(ctx, entityId, "HealthComponent", newHealth);
    hasDied;
  };

  // Private function to handle cargo transfer upon death
  private func handleCargoTransfer(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, damage : Components.DamageComponent, cargo : Components.FungibleComponent) {
    // Get the source entity's cargo
    let sourceFungible = ECS.World.getComponent(ctx, damage.sourceEntityId, "FungibleComponent");
    let newSourceFungible = Option.get(sourceFungible, #FungibleComponent({ tokens = [] }));

    // Combine the source and target's cargo
    let combined = switch (newSourceFungible) {
      case (#FungibleComponent(fungible)) {
        #FungibleComponent({
          tokens = Tokens.mergeTokens(fungible.tokens, cargo.tokens);
        });
      };
      case (_) {
        #FungibleComponent({ tokens = cargo.tokens });
      };
    };

    // Update the source entity's cargo
    ECS.World.addComponent(ctx, damage.sourceEntityId, "FungibleComponent", combined);

    // Reset the target's cargo
    ECS.World.addComponent(ctx, entityId, "FungibleComponent", #FungibleComponent({ tokens = [] }));
  };

  // Private function to handle respawn logic
  private func handleRespawn(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
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

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "DamageComponent"),
      ECS.World.getComponent(ctx, entityId, "FungibleComponent"),
      ECS.World.getComponent(ctx, entityId, "HealthComponent"),
    ) {
      case (
        ? #DamageComponent(damage),
        ? #FungibleComponent(cargo),
        ? #HealthComponent(health),
      ) {
        let hasDied = updateHealth(ctx, entityId, damage, health);

        if (hasDied) {
          // Remove the combatants from combat
          ECS.World.removeComponent(ctx, entityId, "CombatComponent");
          ECS.World.removeComponent(ctx, damage.sourceEntityId, "CombatComponent");

          handleCargoTransfer(ctx, entityId, damage, cargo);
          handleRespawn(ctx, entityId);
        };

        // Remove the damage component after applying damage
        ECS.World.removeComponent(ctx, entityId, "DamageComponent");
      };
      case (_) {};
    };
  };

  public let DamageSystem : ECS.Types.System<Components.Component> = {
    systemType = "DamageSystem";
    archetype = ["DamageComponent", "FungibleComponent", "HealthComponent"];
    update = update;
  };
};
