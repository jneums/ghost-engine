import ECS "mo:geecs";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat8 "mo:base/Nat8";
import Float "mo:base/Float";
import Vector "mo:vector";
import Components "../components";
import Vector3 "../math/Vector3";
import Const "Const";

module {

  public func initialize(ctx : ECS.Types.Context<Components.Component>) {
    let blocks = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(blocks) > 0) {
      Debug.print("Blocks already initialized");
      return;
    };
    let entityId = ECS.World.addEntity(ctx);

    let newBlocks = #BlocksComponent({ chunkPositions = []; blockData = [] });
    ECS.World.addComponent(ctx, entityId, "BlocksComponent", newBlocks);
  };

  public func addOrUpdateBlocks(blocksComponent : Components.BlocksComponent, chunkPos : Text, blocks : [Nat8]) : Components.BlocksComponent {
    let index = Array.indexOf(chunkPos, blocksComponent.chunkPositions, func(a : Text, b : Text) : Bool { a == b });
    switch (index) {
      case (null) {
        // Add new entry
        {
          chunkPositions = Array.append(blocksComponent.chunkPositions, [chunkPos]);
          blockData = Array.append(blocksComponent.blockData, [blocks]);
        };
      };
      case (?i) {
        // Update existing entry
        var newBlockData = Array.thaw<[Nat8]>(blocksComponent.blockData);
        newBlockData[i] := blocks;
        {
          chunkPositions = blocksComponent.chunkPositions;
          blockData = Array.freeze(newBlockData);
        };
      };
    };
  };

  public func getBlocks(blocksComponent : Components.BlocksComponent, chunkPos : Text) : ?[Nat8] {
    let index = Array.indexOf(chunkPos, blocksComponent.chunkPositions, func(a : Text, b : Text) : Bool { a == b });
    switch (index) {
      case (null) { null };
      case (?i) { ?blocksComponent.blockData[i] };
    };
  };

  // Function to generate and store blocks for a given chunk position
  public func generateBlocks(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3) : () {
    // Retrieve the BlocksComponent
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return;
    };

    let blocksComponent = ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent");
    let blockId = blockIdFromVector3(chunkPos);

    switch (blocksComponent) {
      case (? #BlocksComponent(blocks)) {
        // Check if blocks for this chunk position already exist
        if (getBlocks(blocks, blockId) != null) {
          Debug.print("Blocks already generated for this chunk position");
          return; // Exit early if blocks already exist
        };

        // Generate blocks if they don't exist
        let blockCount = Const.CHUNK_SIZE * Const.CHUNK_HEIGHT * Const.CHUNK_SIZE;
        let newBlocks = Array.init<Nat8>(blockCount, 1 : Nat8); // Example: Initialize all blocks to type 1

        // Store the blocks in the BlocksComponent
        let updatedBlocks = addOrUpdateBlocks(blocks, blockId, Array.freeze(newBlocks));
        let updatedBlocksComponent = #BlocksComponent(updatedBlocks);
        ECS.World.addComponent(ctx, entityIds[0], "BlocksComponent", updatedBlocksComponent);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  // Helper function to convert Vector3 to a Text key
  public func blockIdFromVector3(vector : Vector3.Vector3) : Text {
    let xText = Float.toText(vector.x);
    let yText = Float.toText(vector.y);
    let zText = Float.toText(vector.z);
    xText # "," # yText # "," # zText;
  };
};
