import ECS "mo:geecs";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat8 "mo:base/Nat8";
import Float "mo:base/Float";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import TrieMap "mo:base/TrieMap";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import Noise "mo:noise/Noise";
import NoiseTypes "mo:noise/Types";
import Random "mo:noise/Random";
import Map "mo:stable-hash-map/Map/Map";
import Components "../components";
import Vector3 "../math/Vector3";
import Const "Const";
import Chunks "Chunks";
import Splines "Splines";

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
      changedBlocks = [];
    });
    ECS.World.addComponent(ctx, entityId, "BlocksComponent", newBlocks);
    ECS.World.addComponent(ctx, entityId, "UpdateChunksComponent", #UpdateChunksComponent({}));
  };

  func setChunkBlocks(blocksComponent : Components.BlocksComponent, chunkPos : Vector3.Vector3, blocks : [Nat8]) : Components.BlocksComponent {
    let index = Array.indexOf(chunkPos, blocksComponent.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
    switch (index) {
      case (null) {
        // Add new entry
        {
          seed = blocksComponent.seed;
          chunkPositions = Array.append(blocksComponent.chunkPositions, [chunkPos]);
          blockData = Array.append(blocksComponent.blockData, [blocks]);
          chunkStatus = Array.append(blocksComponent.chunkStatus, [0 : Nat8]);
          changedBlocks = Array.append(blocksComponent.changedBlocks, [[]]);
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
          changedBlocks = blocksComponent.changedBlocks;
        };
      };
    };
  };

  func clearChunk(blocksComponent : Components.BlocksComponent, chunkPos : Vector3.Vector3) : Components.BlocksComponent {
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
          changedBlocks = blocksComponent.changedBlocks;
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
          case (?i) {
            // Get the original block data
            let originalBlocks = blocks.blockData[i];
            let mutableBlocks = Array.thaw<Nat8>(originalBlocks);

            if (Array.size(blocks.changedBlocks) < 1 or Array.size(blocks.changedBlocks[i]) < 1) {
              return Array.freeze(mutableBlocks);
            };

            // Apply changes from changedBlocks
            for ((blockIndex, newBlockType) in blocks.changedBlocks[i].vals()) {
              if (blockIndex >= 0 and blockIndex < mutableBlocks.size()) {
                mutableBlocks[blockIndex] := newBlockType;
              };
            };

            Array.freeze(mutableBlocks);
          };
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
        let updatedBlocks = clearChunk(blocks, blockPos);
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
              changedBlocks = blocks.changedBlocks;
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

  public func initClimateSeed(seed : Nat64) : [NoiseTypes.DoublePerlinNoise] {
    // Initialize noise layers
    let xr = Random.xSetSeed(seed);

    let xLow = Random.xNextNat64(xr);
    let xHigh = Random.xNextNat64(xr);

    let temperatureXr = {
      var low = xLow ^ 0x5c7e6b29735f0d7f;
      var high = xHigh ^ 0xf7d86f1bbc734988;
    };
    let temperatureAmps = [1.5, 0.0, 1.0, 0.0, 0.0, 0.0];
    let temperature = Noise.xDoublePerlinInit(temperatureXr, temperatureAmps, -10, temperatureAmps.size(), -1);

    let humidityXr = {
      var low = xLow ^ 0x81bb4d22e8dc168e;
      var high = xHigh ^ 0xf1c8b4bea16303cd;
    };
    let humidityAmps = [1.0, 1.0, 0.0, 0.0, 0.0, 0.0];
    let humidity = Noise.xDoublePerlinInit(humidityXr, humidityAmps, -8, humidityAmps.size(), -1);

    let continentalnessXr = {
      var low = xLow ^ 0x83886c9d0ae3a662;
      var high = xHigh ^ 0xafa638a61b42e8ad;
    };
    let continentalnessAmps = [1.0, 1.0, 2.0, 2.0, 2.0, 1.0, 1.0, 1.0, 1.0];
    let continentalness = Noise.xDoublePerlinInit(continentalnessXr, continentalnessAmps, -9, continentalnessAmps.size(), -1);

    let erosionXr = {
      var low = xLow ^ 0xd02491e6058f6fd8;
      var high = xHigh ^ 0x4792512c94c17a80;
    };
    let erosionAmps = [1.0, 1.0, 0.0, 1.0, 1.0];
    let erosion = Noise.xDoublePerlinInit(erosionXr, erosionAmps, -9, erosionAmps.size(), -1);

    let peaksAndValleysXr = {
      var low = xLow ^ 0x080518cf6af25384;
      var high = xHigh ^ 0x3f3dfb40a54febd5;
    };
    let peaksAndValleysAmps = [1.0, 1.0, 1.0, 0.0];
    let peaksAndValleys = Noise.xDoublePerlinInit(peaksAndValleysXr, peaksAndValleysAmps, -3, peaksAndValleysAmps.size(), -1);

    let weirdnessXr = {
      var low = xLow ^ 0xefc8ef4d36102b34;
      var high = xHigh ^ 0x1beeeb324a0f24ea;
    };
    let weirdnessAmps = [1.0, 2.0, 1.0, 0.0, 0.0, 0.0];
    let weirdness = Noise.xDoublePerlinInit(weirdnessXr, weirdnessAmps, -7, weirdnessAmps.size(), -1);

    [
      temperature,
      humidity,
      continentalness,
      erosion,
      peaksAndValleys,
      weirdness,
    ];
  };

  public func sampleClimateNoise(climate : [NoiseTypes.DoublePerlinNoise], climateType : Nat, x : Float, z : Float) : Float {
    if (climateType == Const.Climate.PeaksAndValleys) {
      let c = Noise.sampleDoublePerlinNoise(climate[Const.Climate.Continentalness], x, 0.0, z);
      let e = Noise.sampleDoublePerlinNoise(climate[Const.Climate.Erosion], x, 0.0, z);
      let w = Noise.sampleDoublePerlinNoise(climate[Const.Climate.Weirdness], x, 0.0, z);
      let newSamples = [c, e, -3.0 * (Float.abs(Float.abs(w) - 0.6666667) - 0.33333334), w];
      let s = Splines.evaluateSpline(newSamples, Splines.initSpline());
      let off = s + 0.015;

      let y = 0 : Int64;
      let d = 1.0 - Float.fromInt64(Int64.bitshiftLeft(y, 2)) / 128 - 83 / 160 + off;

      return d;
    };

    let p = Noise.sampleDoublePerlinNoise(climate[climateType], x, 0.0, z);
    return p;
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

        let climate = initClimateSeed(blocks.seed);

        // Generate blocks based on noise, optimizing by filling columns
        for (z in Iter.range(0, Const.CHUNK_SIZE - 1)) {
          for (x in Iter.range(0, Const.CHUNK_SIZE - 1)) {
            // Calculate global x and z positions
            let globalX = Float.fromInt(x + Float.toInt(chunkPos.x) * Const.CHUNK_SIZE);
            let globalZ = Float.fromInt(z + Float.toInt(chunkPos.z) * Const.CHUNK_SIZE);

            // Sample noise from each map
            let c = sampleClimateNoise(climate, Const.Climate.Continentalness, globalX, globalZ);
            let e = sampleClimateNoise(climate, Const.Climate.Erosion, globalX, globalZ);
            let d = sampleClimateNoise(climate, Const.Climate.PeaksAndValleys, globalX, globalZ);

            // Combine spline values to determine the final height
            let combinedHeight = (c + e + d) / 3.0;

            // Map and floor the combined spline value
            let mappedSplineValue = map(0.0, 128, -1.0, 1.0, combinedHeight);
            let height = Const.CHUNK_HEIGHT - 128 : Nat + fastFloor(mappedSplineValue);

            // Fill blocks from the terrain height downwards
            for (y in Iter.range(0, Const.CHUNK_HEIGHT - 1)) {
              let index = y * Const.CHUNK_SIZE * Const.CHUNK_SIZE +
              z * Const.CHUNK_SIZE +
              x;

              if (y <= height) {
                newBlocks[index] := 1;
              } else if (y <= Const.SEA_LEVEL) {
                newBlocks[index] := 2;
              };
            };
          };
        };

        // Store the blocks in the BlocksComponent
        let updatedBlocks = setChunkBlocks(blocks, chunkPos, Array.freeze(newBlocks));
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

  public func getBlockType(ctx : ECS.Types.Context<Components.Component>, position : Vector3.Vector3) : Nat8 {
    let chunkPos = Chunks.getChunkPosition(position);
    Debug.print("Chunk position: " # debug_show (chunkPos));

    let blocks = getBlocks(ctx, chunkPos);

    // Calculate local position within the chunk
    let localX = (position.x % Float.fromInt(Const.CHUNK_SIZE) + Float.fromInt(Const.CHUNK_SIZE)) % Float.fromInt(Const.CHUNK_SIZE);
    let localY = position.y;
    let localZ = (position.z % Float.fromInt(Const.CHUNK_SIZE) + Float.fromInt(Const.CHUNK_SIZE)) % Float.fromInt(Const.CHUNK_SIZE);

    // Calculate the index within the blocks array
    let index = localX + localZ * Float.fromInt(Const.CHUNK_SIZE) + localY * Float.fromInt(Const.CHUNK_SIZE) * Float.fromInt(Const.CHUNK_SIZE);
    Debug.print("Block index: " # debug_show (index));

    // Ensure the index is within bounds
    if (index >= 0 and Float.toInt(index) < Array.size(blocks)) {
      let blockType = blocks[Int.abs(Float.toInt(index))];
      Debug.print("Block type: " # debug_show (blockType));
      return blockType;
    } else {
      Debug.print("Index out of bounds: " # debug_show (index));
      return 0; // Return a default value or handle the error as needed
    };
  };

  // Set the block type at a specific position within a chunk
  public func setBlockType(ctx : ECS.Types.Context<Components.Component>, position : Vector3.Vector3, blockType : Nat8) {
    let chunkPos = Chunks.getChunkPosition(position);
    Debug.print("Chunk position: " # debug_show (chunkPos));

    let blocks = getBlocks(ctx, chunkPos);
    let mutable = Array.thaw<Nat8>(blocks);

    // Calculate local position within the chunk
    let localX = (position.x % Float.fromInt(Const.CHUNK_SIZE) + Float.fromInt(Const.CHUNK_SIZE)) % Float.fromInt(Const.CHUNK_SIZE);
    let localY = position.y;
    let localZ = (position.z % Float.fromInt(Const.CHUNK_SIZE) + Float.fromInt(Const.CHUNK_SIZE)) % Float.fromInt(Const.CHUNK_SIZE);

    // Calculate the index within the blocks array
    let index = localX + localZ * Float.fromInt(Const.CHUNK_SIZE) + localY * Float.fromInt(Const.CHUNK_SIZE) * Float.fromInt(Const.CHUNK_SIZE);
    Debug.print("Block index: " # debug_show (index));

    // Ensure the index is within bounds
    if (index >= 0 and Float.toInt(index) < mutable.size()) {
      mutable[Int.abs(Float.toInt(index))] := blockType;
    } else {
      Debug.print("Index out of bounds: " # debug_show (index));
      return;
    };

    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return;
    };

    let blocksComponent = ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent");
    switch (blocksComponent) {
      case (? #BlocksComponent(blocks)) {
        // Find the blocks for the given chunk position
        let chunkIdx = Array.indexOf(chunkPos, blocks.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
        switch (chunkIdx) {
          case (null) {};
          case (?i) {
            // Convert changedBlocks to a TrieMap
            let changedChunk = TrieMap.fromEntries<Nat, Nat8>(
              blocks.changedBlocks[i].vals(),
              Nat.equal,
              Map.nhash.0,
            );

            // Insert or update the blockIndex with the new blockType
            changedChunk.put(Int.abs(Float.toInt(index)), blockType);

            // Convert the TrieMap back to an array of entries
            let newChangedChunk = Iter.toArray(changedChunk.entries());

            // Update the changedBlocks for the chunk
            let newChangedBlocks = Array.thaw<[(Nat, Nat8)]>(blocks.changedBlocks);
            newChangedBlocks[i] := newChangedChunk;

            let updatedBlocksComponent = {
              seed = blocks.seed;
              chunkPositions = blocks.chunkPositions;
              blockData = blocks.blockData;
              chunkStatus = blocks.chunkStatus;
              changedBlocks = Array.freeze(newChangedBlocks);
            };

            ECS.World.addComponent(ctx, entityIds[0], "BlocksComponent", #BlocksComponent(updatedBlocksComponent));
          };
        };
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };
};
