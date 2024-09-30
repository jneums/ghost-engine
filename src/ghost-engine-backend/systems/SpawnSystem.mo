import ECS "mo:geecs";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Components "../components";
import Math "../math";
import Random "mo:noise/Random";
import env "../env";
import Tokens "../utils/Tokens";

module {
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _ : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "RespawnComponent")) {
      case (? #RespawnComponent(respawn)) {
        let currentTime = Time.now();
        let elapsedTime = currentTime - respawn.deathTime;
        Debug.print("\nElapsed time: " # debug_show (elapsedTime));
        if (elapsedTime >= respawn.duration) {
          // 1 minute in microseconds
          // Respawn the node
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

          let newNodePosition = {
            x = spawnX;
            y = 0.0;
            z = spawnZ;
          };

          let newNodeTransform = #TransformComponent({
            position = newNodePosition;
            rotation = Math.eulerToQuaternion({ x = 0.0; y = 0.0; z = 0.0 });
            scale = { x = 1.0; y = 1.0; z = 1.0 };
          });

          // Set transform
          ECS.World.addComponent(ctx, entityId, "TransformComponent", newNodeTransform);

          // Reset health
          switch (ECS.World.getComponent(ctx, entityId, "HealthComponent")) {
            case (? #HealthComponent({ max })) {
              ECS.World.addComponent(ctx, entityId, "HealthComponent", #HealthComponent({ amount = max; max = max }));
            };
            case (_) {};
          };

          // If has a resource component, reset the fungible
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

          ECS.World.removeComponent(ctx, entityId, "RespawnComponent");
        };
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
