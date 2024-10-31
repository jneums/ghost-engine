import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Components "../components";
import Vector3 "../math/Vector3";
import Blocks "../utils/Blocks";
import Const "../utils/Const";
import Tokens "../utils/Tokens";
import TokenRegistry "../utils/TokenRegistry";
import Energy "../utils/Energy";

module {
  // Constant for nanoseconds to seconds conversion
  let NANOS_PER_SECOND = 1_000_000_000.0;
  let BASE_MINING_COST = 10_000;

  // Private function to handle cargo transfer and energy deduction
  private func updateFungibles(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, cargo : Components.FungibleComponent, energyCostToken : Tokens.Token) {
    // Get the source entity's cargo
    let sourceFungible = ECS.World.getComponent(ctx, entityId, "FungibleComponent");
    let newSourceFungible = Option.get(sourceFungible, #FungibleComponent({ tokens = [] }));

    switch (newSourceFungible) {
      case (#FungibleComponent(fungible)) {
        // Deduct energy cost
        let updatedTokens = Tokens.removeToken(fungible.tokens, energyCostToken);

        // Combine the source and target's cargo
        let combined = #FungibleComponent({
          tokens = Tokens.mergeTokens(updatedTokens, cargo.tokens);
        });

        // Update the source entity's cargo
        ECS.World.addComponent(ctx, entityId, "FungibleComponent", combined);
      };
      case (_) {};
    };
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "MiningComponent"),
      ECS.World.getComponent(ctx, entityId, "TransformComponent"),
      ECS.World.getComponent(ctx, entityId, "FungibleComponent"),
    ) {
      case (
        ? #MiningComponent(mining),
        ? #TransformComponent(transform),
        ? #FungibleComponent(fungible),
      ) {
        if (Array.size(mining.positions) == 0) {
          Debug.print("No positions to mine");
          ECS.World.removeComponent(ctx, entityId, "MiningComponent");
          return;
        };

        // Get the current mining position
        let currentMiningPosition = mining.positions[0];

        // Calculate the time elapsed since the mining started
        let currentTime = Time.now();
        let elapsedTime = currentTime - mining.startAt;

        // Range check (must be within range)
        let distance = Vector3.distance(transform.position, currentMiningPosition);
        let isInRange = distance <= Float.sqrt(3.0 * Const.MINING_RADIUS);

        // Block check (must be a valid block to mine)
        let block = Blocks.getBlockType(ctx, currentMiningPosition);
        let targetToken = Blocks.getTokenByBlockType(ctx, block);
        let isBlockValid = block != TokenRegistry.BlockType.Air and block != TokenRegistry.BlockType.Water; // Not air or water
        let energyCostToken = Energy.getEnergyCostToken(ctx);
        let energy = Energy.getCurrentPowerLevel(ctx, fungible);

        // If not in range or block is invalid or lacks required energy, stop mining
        if (not isInRange or not isBlockValid or energy == 0) {
          Debug.print("\nInRange: " # debug_show (isInRange) # " BlockValid: " # debug_show (isBlockValid) # " Energy: " # debug_show (energy));
          ECS.World.removeComponent(ctx, entityId, "MiningComponent");
          return;
        };

        let density = switch (targetToken) {
          case (?token) {
            token.density;
          };
          case (_) {
            0;
          };
        };

        // Check if the mining is complete
        let elapsedInSeconds = Float.fromInt(elapsedTime) / NANOS_PER_SECOND;
        Debug.print("\nMining progress: " # debug_show (elapsedInSeconds) # "s / " # debug_show (energy) # "energy / " # debug_show (density) # "density");
        let progress = elapsedInSeconds * energy / Float.fromInt(density);
        if (progress >= 1.0) {
          // Remove the energy block and add the mined block to the unit's inventory
          switch (targetToken, energyCostToken) {
            case (?blockToken, ?energyToken) {
              let blockFungible = {
                tokens = [blockToken];
              };

              // Deduct energy cost
              let totalCost = Tokens.getTokenWithAmount(energyToken, density * BASE_MINING_COST);
              if (Tokens.hasToken(fungible.tokens, totalCost)) {
                updateFungibles(ctx, entityId, blockFungible, totalCost);

                let empty : Nat16 = TokenRegistry.BlockType.Air;
                let updateBlocksComponent = #UpdateBlocksComponent({
                  blocks = [(currentMiningPosition, empty)];
                });
                Blocks.setBlockType(ctx, currentMiningPosition, empty);
                ECS.World.addComponent(ctx, entityId, "UpdateBlocksComponent", updateBlocksComponent);
                ECS.World.removeComponent(ctx, entityId, "MiningComponent");
                Debug.print("\nMining complete");

                // Remove the completed position from the queue
                let remainingPositions = Array.subArray(mining.positions, 1, Array.size(mining.positions) - 1 : Nat);
                if (Array.size(remainingPositions) == 0) {
                  ECS.World.removeComponent(ctx, entityId, "MiningComponent");
                } else {
                  let updatedMining = #MiningComponent({
                    progress = 0.0;
                    positions = remainingPositions;
                    startAt = currentTime;
                  });
                  ECS.World.addComponent(ctx, entityId, "MiningComponent", updatedMining);
                };
              };
            };
            case (_) {
              Debug.print("\nError getting token for block type: " # debug_show (block));
            };
          };
        } else {
          // Update the mining progress
          let updatedMining = #MiningComponent({
            progress = progress;
            positions = mining.positions;
            startAt = mining.startAt;
          });
          ECS.World.addComponent(ctx, entityId, "MiningComponent", updatedMining);
        };

        Debug.print("\nMining progress: " # debug_show (entityId) # " block " # debug_show (currentMiningPosition) # " " # debug_show (elapsedInSeconds) # "s");
      };
      case (_) {};
    };
  };

  public let MiningSystem : ECS.Types.System<Components.Component> = {
    systemType = "MiningSystem";
    archetype = ["MiningComponent", "TransformComponent", "FungibleComponent"];
    update = update;
  };
};
