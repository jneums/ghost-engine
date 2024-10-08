import ECS "mo:geecs";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat8 "mo:base/Nat8";
import Float "mo:base/Float";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Noise "mo:noise/Noise";
import Random "mo:noise/Random";
import Components "../components";
import Vector3 "../math/Vector3";
import Const "Const";
import Chunks "Chunks";

module {

  public func initialize(ctx : ECS.Types.Context<Components.Component>) {
    let blocks = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(blocks) > 0) {
      Debug.print("Blocks already initialized");
      return;
    };
    let entityId = ECS.World.addEntity(ctx);

    let newBlocks = #BlocksComponent({
      seed = 0 : Nat64;
      chunkPositions = [];
      blockData = [];
      chunkStatus = [];
    });
    ECS.World.addComponent(ctx, entityId, "BlocksComponent", newBlocks);
  };

  public func addOrUpdateBlocks(blocksComponent : Components.BlocksComponent, chunkPos : Vector3.Vector3, blocks : [Nat8]) : Components.BlocksComponent {
    let index = Array.indexOf(chunkPos, blocksComponent.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
    switch (index) {
      case (null) {
        // Add new entry
        {
          seed = blocksComponent.seed;
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
          seed = blocksComponent.seed;
          chunkPositions = blocksComponent.chunkPositions;
          blockData = Array.freeze(newBlockData);
          chunkStatus = blocksComponent.chunkStatus;
        };
      };
    };
  };

  public func removeBlocks(blocksComponent : Components.BlocksComponent, chunkPos : Vector3.Vector3) : Components.BlocksComponent {
    let index = Array.indexOf(chunkPos, blocksComponent.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
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
          seed = blocksComponent.seed;
          chunkPositions = blocksComponent.chunkPositions;
          blockData = Array.freeze(newBlockData);
          chunkStatus = blocksComponent.chunkStatus;
        };
      };
    };
  };

  public func getEntityId(ctx : ECS.Types.Context<Components.Component>) : ?ECS.Types.EntityId {
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) > 0) {
      return ?entityIds[0];
    };
    null;
  };

  public func getBlocks(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3) : [Nat8] {
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
        let index = Array.indexOf(chunkPos, blocks.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
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

  public func deleteBlocks(ctx : ECS.Types.Context<Components.Component>, blockPos : Vector3.Vector3) {
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
        if (Array.size(getBlocks(ctx, blockPos)) == 0) {
          Debug.print("Blocks already deleted for this chunk position");
          return; // Exit early if blocks already exist
        };
        // Store the blocks in the BlocksComponent
        let updatedBlocks = removeBlocks(blocks, blockPos);
        let updatedBlocksComponent = #BlocksComponent(updatedBlocks);
        ECS.World.addComponent(ctx, entityIds[0], "BlocksComponent", updatedBlocksComponent);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  public func setStatus(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3, status : Nat8) : () {
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
        let index = Array.indexOf(chunkPos, blocks.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
        switch (index) {
          case (null) {
            Debug.print("Chunk position not found");
          };
          case (?i) {
            // Update the status for the existing chunk position
            var newChunkStatus = Array.thaw<Nat8>(blocks.chunkStatus);
            newChunkStatus[i] := status;
            let updatedBlocksComponent = #BlocksComponent({
              seed = blocks.seed;
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
  public func generateBlocks(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3) : () {
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
        if (Array.size(getBlocks(ctx, chunkPos)) > 0) {
          Debug.print("Blocks already generated for this chunk position");
          return; // Exit early if blocks already exist
        };

        // Generate blocks if they don't exist
        let blockCount = Const.CHUNK_SIZE * Const.CHUNK_HEIGHT * Const.CHUNK_SIZE;
        var newBlocks = Array.init<Nat8>(blockCount, 0 : Nat8); // Initialize all blocks to type 0

        // Initialize noise layers
        let xr = Random.xSetSeed(blocks.seed);

        let continentalness = Noise.xDoublePerlinInit(xr, [1.0, 1.0, 2.0, 2.0, 2.0, 1.0, 1.0, 1.0, 1.0], -9, 9, 9);
        let erosion = Noise.xDoublePerlinInit(xr, [1.0, 1.0, 0, 1.0, 1.0], -9, 5, 5);
        let weirdness = Noise.xDoublePerlinInit(xr, [1, 2, 1, 0, 0, 0], -7, 6, 6);

        // Generate blocks based on noise, optimizing by filling columns
        for (z in Iter.range(0, Const.CHUNK_SIZE - 1)) {
          for (x in Iter.range(0, Const.CHUNK_SIZE - 1)) {
            // Calculate global x and z positions
            let globalX = Float.fromInt(x + Float.toInt(chunkPos.x) * Const.CHUNK_SIZE);
            let globalZ = Float.fromInt(z + Float.toInt(chunkPos.z) * Const.CHUNK_SIZE);

            // Sample noise from each layer
            let continentalnesSample = Noise.sampleDoublePerlinNoise(continentalness, globalX, 0.0, globalZ);
            let erosionSample = Noise.sampleDoublePerlinNoise(erosion, globalX, 0.0, globalZ);
            let weirdnessSample = Noise.sampleDoublePerlinNoise(weirdness, globalX, 0.0, globalZ);

            // Combine noise values
            let combinedHeight = (continentalnesSample + erosionSample + weirdnessSample) / 3.0;

            // Map and floor the combined noise value
            let mappedNoiseValue = map(0.0, 128.0, -1.0, 1.0, combinedHeight);
            let height = fastFloor(mappedNoiseValue);

            Debug.print("Height: " # debug_show (height));
            Debug.print("Mapped noise value: " # debug_show (mappedNoiseValue));

            // Fill blocks from the terrain height downwards
            for (y in Iter.range(0, Const.CHUNK_HEIGHT - 1)) {
              if (y <= height) {
                let index = y * Const.CHUNK_SIZE * Const.CHUNK_SIZE +
                z * Const.CHUNK_SIZE +
                x;
                newBlocks[index] := 1; // Example: Set block type to 1
              };
            };
          };
        };

        // Store the blocks in the BlocksComponent
        let updatedBlocks = addOrUpdateBlocks(blocks, chunkPos, Array.freeze(newBlocks));
        let updatedBlocksComponent = #BlocksComponent(updatedBlocks);
        ECS.World.addComponent(ctx, entityIds[0], "BlocksComponent", updatedBlocksComponent);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  // Helper function to map noise values
  func map(min : Float, max : Float, omin : Float, omax : Float, value : Float) : Float {
    return min + (max - min) * ((value - omin) / (omax - omin));
  };

  // Helper function to floor a float value
  func fastFloor(f : Float) : Int {
    return if (f >= 0.0) Float.toInt(f) else Float.toInt(f) - 1;
  };

  // Function to get the highest solid block y-value at a given position
  public func getHighestSolidBlockY(ctx : ECS.Types.Context<Components.Component>, position : Vector3.Vector3) : Float {
    // Convert the position to a chunk position key
    let chunkPos = Chunks.getChunkPosition(position);

    // Retrieve the block data for the chunk
    let blocks = getBlocks(ctx, chunkPos);

    // Determine the x and z indices within the chunk
    let xIndex = Float.toInt(position.x) % Const.CHUNK_SIZE;
    let zIndex = Float.toInt(position.z) % Const.CHUNK_SIZE;

    // Initialize the highest y-value
    var highestY = -1; // Start with -1 to indicate no solid block found

    // Iterate over the y-values in the chunk
    for (y in Iter.range(0, Const.CHUNK_HEIGHT)) {
      let index = xIndex + zIndex * Const.CHUNK_SIZE + y * Const.CHUNK_SIZE * Const.CHUNK_SIZE;
      if (index < Array.size(blocks) and blocks[Int.abs(index)] != 0) {
        highestY := y;
      };
    };

    // Return the highest y-value as a float, or 0 if no solid block is found
    if (highestY == -1) {
      0.0;
    } else {
      Float.fromInt(highestY);
    };
  };
};
