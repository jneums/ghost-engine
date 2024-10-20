import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Float "mo:base/Float";
import Components "../components";
import Vector3 "../math/Vector3";
import Blocks "../utils/Blocks";
import Tokens "../utils/Tokens";
import Const "../utils/Const";

module {
  // Private function to update the player's cargo after placing a block
  private func updateCargoAfterPlacement(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, block : Tokens.Token) {
    // Get the player's cargo
    let sourceFungible = ECS.World.getComponent(ctx, entityId, "FungibleComponent");
    let newSourceFungible = Option.get(sourceFungible, #FungibleComponent({ tokens = [] }));

    switch (newSourceFungible) {
      case (#FungibleComponent(fungible)) {
        // Remove the block/token from the player's cargo
        let updatedTokens = Tokens.removeToken(fungible.tokens, block);

        // Update the player's cargo
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
        // Check if the player has the required block/token in their cargo
        let blockType = placeBlock.blockType;
        let token = Tokens.getTokenByBlockType(blockType);
        let hasToken = Tokens.hasToken(fungible.tokens, token);

        if (not hasToken) {
          Debug.print("\nBlock placement failed: " # debug_show (entityId) # " does not have the required block/token.");
          ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
          return;
        };

        // Range check (must be within range)
        let distance = Vector3.distance(transform.position, placeBlock.position);
        let isInRange = distance <= Float.sqrt(3.0 * Const.PLACEMENT_RADIUS);

        if (not isInRange) {
          Debug.print("\nBlock placement failed: " # debug_show (entityId) # " is out of range.");
          ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
          return;
        };

        // Make sure the block is not being placed over anything
        let block = Blocks.getBlockType(ctx, placeBlock.position);
        if (block != Const.BlockType.Air) {
          Debug.print("\nBlock placement failed: " # debug_show (entityId) # " cannot place block over another block.");
          ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
          return;
        };

        // Place the block in the world
        Blocks.setBlockType(ctx, placeBlock.position, blockType);
        ECS.World.removeComponent(ctx, entityId, "PlaceBlockComponent");
        let updateBlocksComponent = #UpdateBlocksComponent({
          blocks = [(placeBlock.position, blockType)];
        });
        ECS.World.addComponent(ctx, entityId, "UpdateBlocksComponent", updateBlocksComponent);

        // Update the player's cargo
        updateCargoAfterPlacement(ctx, entityId, token);

        Debug.print("\nBlock placed: " # debug_show (entityId) # " placed block " # debug_show (blockType) # " at " # debug_show (placeBlock.position));
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
