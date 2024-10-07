import ECS "mo:geecs";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat8 "mo:base/Nat8";
import Float "mo:base/Float";
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

    let newBlocks = #BlocksComponent({
      chunkPositions = [];
      blockData = [];
      chunkStatus = [];
    });
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
          chunkStatus = Array.append(blocksComponent.chunkStatus, [0 : Nat8]);
        };
      };
      case (?i) {
        // Update existing entry
        var newBlockData = Array.thaw<[Nat8]>(blocksComponent.blockData);
        newBlockData[i] := blocks;
        {
          chunkPositions = blocksComponent.chunkPositions;
          blockData = Array.freeze(newBlockData);
          chunkStatus = blocksComponent.chunkStatus;
        };
      };
    };
  };

  public func removeBlocks(blocksComponent : Components.BlocksComponent, chunkPos : Text) : Components.BlocksComponent {
    let index = Array.indexOf(chunkPos, blocksComponent.chunkPositions, func(a : Text, b : Text) : Bool { a == b });
    switch (index) {
      case (null) {
        // Ignore if not exists
        blocksComponent;
      };
      case (?i) {
        // Update existing entry
        var newBlockData = Array.thaw<[Nat8]>(blocksComponent.blockData);
        newBlockData[i] := [];
        {
          chunkPositions = blocksComponent.chunkPositions;
          blockData = Array.freeze(newBlockData);
          chunkStatus = blocksComponent.chunkStatus;
        };
      };
    };
  };

  public func getBlocks(ctx : ECS.Types.Context<Components.Component>, chunkPos : Text) : [Nat8] {
    // Retrieve the BlocksComponent
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return [];
    };

    let blocksComponent = ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent");
    switch (blocksComponent) {
      case (? #BlocksComponent(blocks)) {
        // Find the blocks for the given chunk position
        let index = Array.indexOf(chunkPos, blocks.chunkPositions, func(a : Text, b : Text) : Bool { a == b });
        switch (index) {
          case (null) { [] };
          case (?i) { blocks.blockData[i] };
        };
      };
      case (_) {
        Debug.print("BlocksComponent not found");
        [];
      };
    };
  };

  public func deleteBlocks(ctx : ECS.Types.Context<Components.Component>, blockId : Text) {
    // Retrieve the BlocksComponent
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return;
    };

    let blocksComponent = ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent");

    switch (blocksComponent) {
      case (? #BlocksComponent(blocks)) {
        // Check if blocks for this chunk position already exist
        if (Array.size(getBlocks(ctx, blockId)) == 0) {
          Debug.print("Blocks already deleted for this chunk position");
          return; // Exit early if blocks already exist
        };
        // Store the blocks in the BlocksComponent
        let updatedBlocks = removeBlocks(blocks, blockId);
        let updatedBlocksComponent = #BlocksComponent(updatedBlocks);
        ECS.World.addComponent(ctx, entityIds[0], "BlocksComponent", updatedBlocksComponent);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  public func setStatus(ctx : ECS.Types.Context<Components.Component>, chunkPos : Text, status : Nat8) : () {
    // Retrieve the BlocksComponent
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return;
    };

    let blocksComponent = ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent");

    switch (blocksComponent) {
      case (? #BlocksComponent(blocks)) {
        // Find the index of the chunk position
        let index = Array.indexOf(chunkPos, blocks.chunkPositions, func(a : Text, b : Text) : Bool { a == b });
        switch (index) {
          case (null) {
            Debug.print("Chunk position not found");
          };
          case (?i) {
            // Update the status for the existing chunk position
            var newChunkStatus = Array.thaw<Nat8>(blocks.chunkStatus);
            newChunkStatus[i] := status;
            let updatedBlocksComponent = #BlocksComponent({
              chunkPositions = blocks.chunkPositions;
              blockData = blocks.blockData;
              chunkStatus = Array.freeze(newChunkStatus);
            });
            ECS.World.addComponent(ctx, entityIds[0], "BlocksComponent", updatedBlocksComponent);
          };
        };
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  // Function to generate and store blocks for a given chunk position
  public func generateBlocks(ctx : ECS.Types.Context<Components.Component>, blockId : Text) : () {
    // Retrieve the BlocksComponent
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return;
    };

    let blocksComponent = ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent");

    switch (blocksComponent) {
      case (? #BlocksComponent(blocks)) {
        // Check if blocks for this chunk position already exist
        if (Array.size(getBlocks(ctx, blockId)) > 0) {
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
