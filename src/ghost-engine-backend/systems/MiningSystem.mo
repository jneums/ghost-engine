import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Components "../components";
import Vector3 "../math/Vector3";
import Blocks "../utils/Blocks";
import Const "../utils/Const";

module {
  // Constant for nanoseconds to seconds conversion
  let NANOS_PER_SECOND = 1_000_000_000.0;

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "MiningComponent"),
      ECS.World.getComponent(ctx, entityId, "TransformComponent"),
    ) {
      case (
        ? #MiningComponent(mining),
        ? #TransformComponent(transform),
      ) {

        // Calculate the time elapsed since the mining started
        let currentTime = Time.now();
        let elapsedTime = currentTime - mining.startAt;

        // Range check (must be within range)
        let distance = Vector3.distance(transform.position, mining.position);
        let isInRange = distance <= Float.sqrt(3.0 * Const.MINING_RADIUS);

        // Block check (must be a valid block to mine)
        let block = Blocks.getBlockType(ctx, mining.position);
        let isBlockValid = block != 0 and block != 2; // Not air or water

        // If not in range, stop mining
        if (not isInRange or not isBlockValid) {
          Debug.print("\nMining stopped: " # debug_show (entityId));
          ECS.World.removeComponent(ctx, entityId, "MiningComponent");
          return;
        };

        // Check if the mining is complete
        let elapsedInSeconds = Float.fromInt(elapsedTime) / NANOS_PER_SECOND;
        if (elapsedInSeconds >= mining.speed) {
          let empty : Nat8 = 0;
          Blocks.setBlockType(ctx, mining.position, empty);
          ECS.World.removeComponent(ctx, entityId, "MiningComponent");
          let updateBlocksComponent = #UpdateBlocksComponent({
            blocks = [(mining.position, empty)];
          });
          ECS.World.addComponent(ctx, entityId, "UpdateBlocksComponent", updateBlocksComponent);
        };

        Debug.print("\nMining progress: " # debug_show (entityId) # " block " # debug_show (mining.position) # " " # debug_show (elapsedInSeconds) # "s / " # debug_show (mining.speed) # "s");
      };
      case (_) {};
    };
  };

  public let MiningSystem : ECS.Types.System<Components.Component> = {
    systemType = "MiningSystem";
    archetype = ["MiningComponent", "TransformComponent"];
    update = update;
  };
};
