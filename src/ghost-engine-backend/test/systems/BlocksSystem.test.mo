import { test; suite; expect } "mo:test/async";

import ECS "mo:geecs";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Components "../../components";
import { BlocksSystem } "../../systems/BlocksSystem";
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
      chunkPositions = ["chunk1", "chunk2"];
      blockData = [[] : [Nat8], [] : [Nat8]];
      chunkStatus = [1 : Nat8, 0 : Nat8];
    });
    ECS.World.addComponent(ctx, entityId, "BlocksComponent", blocksComponent);

    await test(
      "Generates blocks for chunks with status 1",
      func() : async () {
        // Run the BlocksSystem update
        await BlocksSystem.update(ctx, entityId, 0);

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
        // Set status of chunk1 to 0 and chunk2 to 1
        let blocks = #BlocksComponent({
          chunkPositions = ["chunk1", "chunk2"];
          blockData = [[] : [Nat8], [] : [Nat8]];
          chunkStatus = [0 : Nat8, 1 : Nat8];
        });
        ECS.World.addComponent(ctx, entityId, "BlocksComponent", blocks);

        // Run the BlocksSystem update
        await BlocksSystem.update(ctx, entityId, 0);

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
