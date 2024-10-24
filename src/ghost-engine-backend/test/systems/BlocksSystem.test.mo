import { test; suite; expect } "mo:test/async";

import ECS "mo:geecs";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Time "mo:base/Time";
import Components "../../components";
import { ChunksSystem } "../../systems/ChunksSystem";
import Utils "../Utils";

suite(
  "Blocks System",
  func() : async () {

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

    let playerEntityId = ECS.World.addEntity(ctx);

    await test(
      "Generates blocks for chunks that player is in",
      func() : async () {
        // Add player chunks component
        let unitChunks = #UnitChunksComponent({
          chunks = [{
            chunkId = { x = 0.0; y = 0.0; z = 0.0 };
            updatedAt = Time.now();
          }];
        });
        ECS.World.addComponent(ctx, playerEntityId, "UnitChunksComponent", unitChunks);

        // Run the ChunksSystem update
        await ChunksSystem.update(ctx, entityId, 0);

        // Check that blocks were generated for chunk1
        let blocksComponent = ECS.World.getComponent(ctx, entityId, "BlocksComponent");
        switch (blocksComponent) {
          case (? #BlocksComponent(blocks)) {
            expect.nat(Array.size(blocks.blockData[0])).notEqual(0); // Blocks should be generated
            expect.nat(Array.size(blocks.blockData[1])).equal(0); // Blocks should be deleted
          };
          case (_) {
            Debug.print("BlocksComponent not found");
          };
        };
      },
    );

    await test(
      "Deletes blocks for chunks with status 0",
      func() : async () {
        // Add player chunks component
        let unitChunks = #UnitChunksComponent({
          chunks = [{
            chunkId = { x = 1.0; y = 0.0; z = 0.0 };
            updatedAt = Time.now();
          }];
        });
        ECS.World.addComponent(ctx, playerEntityId, "UnitChunksComponent", unitChunks);

        // Run the ChunksSystem update
        await ChunksSystem.update(ctx, entityId, 0);

        // Check that blocks were deleted for chunk1 and generated for chunk2
        let blocksComponent = ECS.World.getComponent(ctx, entityId, "BlocksComponent");
        switch (blocksComponent) {
          case (? #BlocksComponent(blocks)) {
            expect.nat(Array.size(blocks.blockData[0])).equal(0); // Blocks should be deleted
            expect.nat(Array.size(blocks.blockData[1])).notEqual(0); // Blocks should be generated
          };
          case (_) {
            Debug.print("BlocksComponent not found");
          };
        };
      },
    );
  },
);
