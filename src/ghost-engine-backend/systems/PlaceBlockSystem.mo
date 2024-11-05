import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Float "mo:base/Float";
import Array "mo:base/Array";
import Components "../components";
import Vector3 "../math/Vector3";
import Blocks "../utils/Blocks";
import Tokens "../utils/Tokens";
import Const "../utils/Const";
import TokenRegistry "../utils/TokenRegistry";
import Energy "../utils/Energy";

module {
  let NANOS_PER_SECOND = 1_000_000_000.0;
  let BASE_PLACEMENT_COST = 5_000; // Example base cost for placing a block

  private func removeFromWallet(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, token : Tokens.Token) {
    let sourceFungible = ECS.World.getComponent(ctx, entityId, "FungibleComponent");
    let newSourceFungible = Option.get(sourceFungible, #FungibleComponent({ tokens = [] }));

    switch (newSourceFungible) {
      case (#FungibleComponent(fungible)) {
        let updatedTokens = Tokens.removeToken(fungible.tokens, token);
        let updatedFungible = #FungibleComponent({
          tokens = updatedTokens;
        });
        ECS.World.addComponent(ctx, entityId, "FungibleComponent", updatedFungible);
      };
      case (_) {};
    };
  };

  private func deductEnergy(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, energyCost : Nat) {
    let sourceFungible = ECS.World.getComponent(ctx, entityId, "FungibleComponent");
    let newSourceFungible = Option.get(sourceFungible, #FungibleComponent({ tokens = [] }));

    switch (newSourceFungible) {
      case (#FungibleComponent(fungible)) {
        let energyCostToken = TokenRegistry.Energy;
        let totalCost = Tokens.getTokenWithAmount(energyCostToken, energyCost);
        let updatedTokens = Tokens.removeToken(fungible.tokens, totalCost);
        let updatedFungible = #FungibleComponent({
          tokens = updatedTokens;
        });
        ECS.World.addComponent(ctx, entityId, "FungibleComponent", updatedFungible);

      };
      case (_) {};
    };
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "PlaceBlockComponent"),
      ECS.World.getComponent(ctx, entityId, "TransformComponent"),
      ECS.World.getComponent(ctx, entityId, "FungibleComponent"),
    ) {
      case (
        ? #PlaceBlockComponent(placeBlock),
        ? #TransformComponent(transform),
        ? #FungibleComponent(fungible),
      ) {
        if (Array.size(placeBlock.positions) == 0 or Array.size(placeBlock.tokenCids) == 0) {
          ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
          return;
        };

        let currentPosition = placeBlock.positions[0];
        let currentTokenCid = placeBlock.tokenCids[0];
        Debug.print("\nPlacing block at: " # debug_show (currentPosition) # " with token CID: " # debug_show (currentTokenCid));

        switch (Blocks.getTypeByTokenCid(ctx, currentTokenCid)) {
          case (?blockType) {
            switch (Blocks.getTokenByBlockType(ctx, blockType)) {
              case (?block) {
                let hasToken = Tokens.hasToken(fungible.tokens, block.dropInfo.token);

                if (not hasToken) {
                  Debug.print("\nBlock placement failed: " # debug_show (entityId) # " does not have the required block/token.");
                  ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
                  return;
                };

                let distance = Vector3.distance(transform.position, currentPosition);
                let isInRange = distance <= Float.sqrt(3.0 * Const.PLACEMENT_RADIUS);

                if (not isInRange) {
                  Debug.print("\nBlock placement failed: " # debug_show (entityId) # " is out of range.");
                  ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
                  return;
                };

                let existingBlock = Blocks.getBlockType(ctx, currentPosition);
                if (existingBlock != TokenRegistry.BlockType.Air) {
                  Debug.print("\nBlock placement failed: " # debug_show (entityId) # " cannot place block over another block.");
                  ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
                  return;
                };

                let energy = Energy.getCurrentPowerLevel(fungible);
                if (energy == 0) {
                  Debug.print("\nBlock placement failed: " # debug_show (entityId) # " does not have enough energy.");
                  ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
                  return;
                };

                // Calculate elapsed time and progress
                let currentTime = Time.now();
                let elapsedTime = currentTime - placeBlock.startAt;
                let elapsedInSeconds = Float.fromInt(elapsedTime) / NANOS_PER_SECOND;
                let progress = elapsedInSeconds * energy / Float.fromInt(block.dropInfo.token.density);

                if (progress >= 1.0) {
                  // Deduct energy cost
                  let energyCost = block.dropInfo.token.density * BASE_PLACEMENT_COST;
                  deductEnergy(ctx, entityId, energyCost);

                  // Place the block in the world
                  Blocks.setBlockType(ctx, currentPosition, blockType);
                  let updateBlocksComponent = #UpdateBlocksComponent({
                    blocks = [(currentPosition, blockType)];
                  });
                  ECS.World.addComponent(ctx, entityId, "UpdateBlocksComponent", updateBlocksComponent);

                  removeFromWallet(ctx, entityId, block.dropInfo.token);

                  Debug.print("\nBlock placed: " # debug_show (entityId) # " placed block " # debug_show (blockType) # " at " # debug_show (currentPosition));

                  // Remove the placed position and tokenCid from the queue
                  let remainingPositions = Array.subArray(placeBlock.positions, 1, Array.size(placeBlock.positions) - 1 : Nat);
                  let remainingTokenCids = Array.subArray(placeBlock.tokenCids, 1, Array.size(placeBlock.tokenCids) - 1 : Nat);
                  let updatedPlaceBlock = #PlaceBlockComponent({
                    positions = remainingPositions;
                    tokenCids = remainingTokenCids;
                    startAt = currentTime;
                    progress = 0.0;
                  });
                  ECS.World.addComponent(ctx, entityId, "PlaceBlockComponent", updatedPlaceBlock);
                } else {
                  // Update the placement progress
                  let updatedPlaceBlock = #PlaceBlockComponent({
                    positions = placeBlock.positions;
                    tokenCids = placeBlock.tokenCids;
                    startAt = placeBlock.startAt;
                    progress = progress;
                  });
                  ECS.World.addComponent(ctx, entityId, "PlaceBlockComponent", updatedPlaceBlock);
                };
              };
              case (null) {
                Debug.print("\nBlock placement failed: " # debug_show (entityId) # " block/token not found in registry.");
                ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
                return;
              };
            };
          };
          case (null) {
            Debug.print("\nBlock placement failed: " # debug_show (entityId) # " block/token not found in registry.");
            ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
            return;
          };
        };

      };
      case (_) {};
    };
  };

  public let PlaceBlockSystem : ECS.Types.System<Components.Component> = {
    systemType = "PlaceBlockSystem";
    archetype = ["PlaceBlockComponent", "TransformComponent"];
    update = update;
  };
};
