import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";
import Const "../utils/Const";

module {

  // Private function to reset the health component
  private func resetHealth(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    switch (ECS.World.getComponent(ctx, entityId, "HealthComponent")) {
      case (? #HealthComponent({ max })) {
        ECS.World.addComponent(ctx, entityId, "HealthComponent", #HealthComponent({ amount = max; max = max }));
      };
      case (_) {};
    };
  };

  // Private function to handle the respawn logic
  private func handleRespawn(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, respawn : Components.RespawnComponent) {
    let currentTime = Time.now();
    let elapsedTime = currentTime - respawn.deathTime;

    if (elapsedTime >= respawn.duration) {
      let newNodeTransform = #TransformComponent(Const.SpawnPoint);

      // Set transform
      ECS.World.addComponent(ctx, entityId, "TransformComponent", newNodeTransform);

      // Reset health
      resetHealth(ctx, entityId);

      // Remove the respawn component
      ECS.World.removeComponent(ctx, entityId, "RespawnComponent");
    };
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _ : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "RespawnComponent")) {
      case (? #RespawnComponent(respawn)) {
        handleRespawn(ctx, entityId, respawn);
      };
      case (_) {};
    };
  };

  public let SpawnSystem : ECS.Types.System<Components.Component> = {
    systemType = "SpawnSystem";
    archetype = ["RespawnComponent"];
    update = update;
  };
};
