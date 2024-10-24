import { test; suite } "mo:test";

import ECS "mo:geecs";
import Nat "mo:base/Nat";
import Components "../../components";
import Utils "../Utils";
import Blocks "../../utils/Blocks";

suite(
  "Blocks",
  func() {
    // Initialize the entity counter:
    var entityCounter : Nat = 0;
    let nextEntityId = func() : Nat {
      entityCounter += 1;
      entityCounter;
    };

    // Initialize the required ECS data structures:
    let ctx : ECS.Types.Context<Components.Component> = Utils.createContext(nextEntityId);

    // Create a new entity with a BlocksComponent
    let entityId = ECS.World.addEntity(ctx);
    let blocksComponent = #BlocksComponent({
      seed = 0 : Nat64;
      chunkPositions = [{ x = 0.0; y = 0.0; z = 0.0 }, { x = 1.0; y = 0.0; z = 0.0 }];
      blockData = [[] : [Nat16], [] : [Nat16]];
      chunkStatus = [0 : Nat8, 0 : Nat8];
      changedBlocks = [];
      tokenRegistry = [];
    });
    ECS.World.addComponent(ctx, entityId, "BlocksComponent", blocksComponent);

    test(
      "Generate unique blocks per chunk",
      func() {
        let chunkPos0 = { x = 0.0; y = 0.0; z = 0.0 };

        Blocks.generateBlocks(ctx, chunkPos0);
        let result = Blocks.getBlocks(ctx, chunkPos0);

        let chunkPos1 = { x = 1.0; y = 0.0; z = 0.0 };
        Blocks.generateBlocks(ctx, chunkPos1);
        let result1 = Blocks.getBlocks(ctx, chunkPos1);

        assert result != result1;
      },
    );
  },
);
