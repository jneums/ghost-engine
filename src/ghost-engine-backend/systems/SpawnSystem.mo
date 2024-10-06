import ECS "mo:geecs";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Components "../components";
import Random "mo:noise/Random";
import env "../env";
import Tokens "../utils/Tokens";
import Vector3 "../math/Vector3";
import Quaternion "../math/Quaternion";

module {

  // Private function to calculate a new spawn position
  private func calculateSpawnPosition(entityId : ECS.Types.EntityId, currentTime : Time.Time) : Vector3.Vector3 {
    let xoro = Random.xSetSeed(Nat64.fromNat(Int.abs(currentTime) + entityId));
    let x = Random.xNextFloat(xoro);
    let z = Random.xNextFloat(xoro);

    // Convert x and z to the range of the spawn boundary
    let minX = -48.0; // Example boundary values
    let maxX = 48.0;
    let minZ = -48.0;
    let maxZ = 48.0;

    let spawnX = minX + x * (maxX - minX);
    let spawnZ = minZ + z * (maxZ - minZ);

    {
      x = spawnX;
      y = 0.0;
      z = spawnZ;
    };
  };

  // Private function to reset the health component
  private func resetHealth(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    switch (ECS.World.getComponent(ctx, entityId, "HealthComponent")) {
      case (? #HealthComponent({ max })) {
        ECS.World.addComponent(ctx, entityId, "HealthComponent", #HealthComponent({ amount = max; max = max }));
      };
      case (_) {};
    };
  };

  // Private function to reset the fungible component if the entity has a resource component
  private func resetFungible(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    switch (ECS.World.getComponent(ctx, entityId, "ResourceComponent")) {
      case (? #ResourceComponent(_)) {
        let updated = #FungibleComponent({
          tokens = [{
            symbol = "tENGINE";
            amount = Tokens.toE8s(1);
            cid = Principal.fromText(env.CANISTER_ID_ICRC1_LEDGER_CANISTER);
          }];
        });
        ECS.World.addComponent(ctx, entityId, "FungibleComponent", updated);
      };
      case (_) {};
    };
  };

  // Private function to handle the respawn logic
  private func handleRespawn(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, respawn : Components.RespawnComponent) {
    let currentTime = Time.now();
    let elapsedTime = currentTime - respawn.deathTime;

    if (elapsedTime >= respawn.duration) {
      let newNodePosition = calculateSpawnPosition(entityId, currentTime);

      let newNodeTransform = #TransformComponent({
        position = newNodePosition;
        rotation = Quaternion.eulerToQuaternion({ x = 0.0; y = 0.0; z = 0.0 });
        scale = { x = 1.0; y = 1.0; z = 1.0 };
      });

      // Set transform
      ECS.World.addComponent(ctx, entityId, "TransformComponent", newNodeTransform);

      // Reset health
      resetHealth(ctx, entityId);

      // Reset fungible if applicable
      resetFungible(ctx, entityId);

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
