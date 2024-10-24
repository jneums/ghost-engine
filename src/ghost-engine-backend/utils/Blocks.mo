import ECS "mo:geecs";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat16 "mo:base/Nat16";
import Float "mo:base/Float";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import TrieMap "mo:base/TrieMap";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import Principal "mo:base/Principal";
import Option "mo:base/Option";
import Nat32 "mo:base/Nat32";
import Text "mo:base/Text";
import Map "mo:stable-hash-map/Map/Map";
import Components "../components";
import Vector3 "../math/Vector3";
import Const "Const";
import Chunks "Chunks";
import Climate "Climate";
import Tokens "Tokens";
import TokenRegistry "TokenRegistry";

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
      tokenRegistry = TokenRegistry.GeneratedBlocks;
    });
    ECS.World.addComponent(ctx, entityId, "BlocksComponent", newBlocks);
    ECS.World.addComponent(ctx, entityId, "UpdateChunksComponent", #UpdateChunksComponent({}));
  };

  func setChunkBlocks(blocksComponent : Components.BlocksComponent, chunkPos : Vector3.Vector3, blocks : [Nat16]) : Components.BlocksComponent {
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
          tokenRegistry = blocksComponent.tokenRegistry;
        };
      };
      case (?i) {
        // Update existing entry
        var newBlockData = Array.thaw<[Nat16]>(blocksComponent.blockData);
        newBlockData[i] := blocks;
        {
          seed = blocksComponent.seed;
          chunkPositions = blocksComponent.chunkPositions;
          blockData = Array.freeze(newBlockData);
          chunkStatus = blocksComponent.chunkStatus;
          changedBlocks = blocksComponent.changedBlocks;
          tokenRegistry = blocksComponent.tokenRegistry;
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
        var newBlockData = Array.thaw<[Nat16]>(blocksComponent.blockData);
        newBlockData[i] := [];
        {
          seed = blocksComponent.seed;
          chunkPositions = blocksComponent.chunkPositions;
          blockData = Array.freeze(newBlockData);
          chunkStatus = blocksComponent.chunkStatus;
          changedBlocks = blocksComponent.changedBlocks;
          tokenRegistry = blocksComponent.tokenRegistry;
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

  public func getBlocks(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3) : [Nat16] {
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
            let mutableBlocks = Array.thaw<Nat16>(originalBlocks);

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
              tokenRegistry = blocks.tokenRegistry;
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
        var newBlocks = Array.init<Nat16>(blockCount, 0 : Nat16); // Initialize all blocks to type 0

        let climate = Climate.initClimateSeed(blocks.seed);

        // Generate blocks based on noise, optimizing by filling columns
        for (z in Iter.range(0, Const.CHUNK_SIZE - 1)) {
          for (x in Iter.range(0, Const.CHUNK_SIZE - 1)) {
            // Calculate global x and z positions
            let globalX = Float.fromInt(x + Float.toInt(chunkPos.x) * Const.CHUNK_SIZE);
            let globalZ = Float.fromInt(z + Float.toInt(chunkPos.z) * Const.CHUNK_SIZE);

            // Sample noise from each map
            let c = Climate.sampleClimateNoise(climate, Const.Climate.Continentalness, globalX, globalZ);
            let e = Climate.sampleClimateNoise(climate, Const.Climate.Erosion, globalX, globalZ);
            let d = Climate.sampleClimateNoise(climate, Const.Climate.PeaksAndValleys, globalX, globalZ);

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

  public func getBlockType(ctx : ECS.Types.Context<Components.Component>, position : Vector3.Vector3) : Nat16 {
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
  public func setBlockType(ctx : ECS.Types.Context<Components.Component>, position : Vector3.Vector3, blockType : Nat16) {
    let chunkPos = Chunks.getChunkPosition(position);
    Debug.print("Chunk position: " # debug_show (chunkPos));

    let blocks = getBlocks(ctx, chunkPos);
    let mutable = Array.thaw<Nat16>(blocks);

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
            let changedChunk = TrieMap.fromEntries<Nat, Nat16>(
              blocks.changedBlocks[i].vals(),
              Nat.equal,
              Map.nhash.0,
            );

            // Insert or update the blockIndex with the new blockType
            changedChunk.put(Int.abs(Float.toInt(index)), blockType);

            // Convert the TrieMap back to an array of entries
            let newChangedChunk = Iter.toArray(changedChunk.entries());

            // Update the changedBlocks for the chunk
            let newChangedBlocks = Array.thaw<[(Nat, Nat16)]>(blocks.changedBlocks);
            newChangedBlocks[i] := newChangedChunk;

            let updatedBlocksComponent = {
              seed = blocks.seed;
              chunkPositions = blocks.chunkPositions;
              blockData = blocks.blockData;
              chunkStatus = blocks.chunkStatus;
              changedBlocks = Array.freeze(newChangedBlocks);
              tokenRegistry = blocks.tokenRegistry;
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

  public func getTokenByBlockType(ctx : ECS.Types.Context<Components.Component>, blockType : Nat16) : ?Tokens.Token {
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return null;
    };

    let blocksComponent = ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent");
    switch (blocksComponent) {
      case (? #BlocksComponent(blocks)) {

        let tokenRegistryMap = TrieMap.fromEntries<Nat16, Tokens.Token>(
          blocks.tokenRegistry.vals(),
          Nat16.equal,
          func(a : Nat16) : Hash.Hash { Nat32.fromNat16(a) },
        );

        tokenRegistryMap.get(blockType);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
        return null;
      };
    };
  };

  public func registerToken(ctx : ECS.Types.Context<Components.Component>, token : Tokens.Token, offset : Nat8) {
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return;
    };

    let blocksComponent = ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent");
    switch (blocksComponent) {
      case (? #BlocksComponent(blocks)) {

        // Check if the token CID is already registered
        if (Option.isSome(getTypeByTokenCid(ctx, Principal.fromText(token.cid)))) {
          Debug.print("Token CID already registered");
          return;
        };

        let tokenRegistryMap = TrieMap.fromEntries<Nat16, Tokens.Token>(
          blocks.tokenRegistry.vals(),
          Nat16.equal,
          func(a : Nat16) : Hash.Hash { Nat32.fromNat16(a) },
        );

        // Get the next highest available blockType over 1000
        var blockType = Nat16.fromNat8(offset) * 1000 : Nat16;
        label findHighest for (i in Iter.range(1000, 65535)) {
          if (Option.isNull(tokenRegistryMap.get(Nat16.fromNat(i)))) {
            blockType := Nat16.fromNat(i);
            break findHighest;
          };
        };

        // Add the token CID to the token registry
        tokenRegistryMap.put(blockType, token);

        // Convert the TrieMap back to an array of entries
        let newTokenRegistry = Iter.toArray(tokenRegistryMap.entries());

        let updatedBlocksComponent = {
          seed = blocks.seed;
          chunkPositions = blocks.chunkPositions;
          blockData = blocks.blockData;
          chunkStatus = blocks.chunkStatus;
          changedBlocks = blocks.changedBlocks;
          tokenRegistry = newTokenRegistry;
        };

        ECS.World.addComponent(ctx, entityIds[0], "BlocksComponent", #BlocksComponent(updatedBlocksComponent));
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  public func getTypeByTokenCid(ctx : ECS.Types.Context<Components.Component>, tokenCid : Principal) : ?Nat16 {
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return null;
    };

    let blocksComponent = ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent");
    switch (blocksComponent) {
      case (? #BlocksComponent(blocks)) {
        // Convert tokenRegistry to a TrieMap
        let blockTypeFirst = Array.map<(Nat16, Tokens.Token), (Text, Nat16)>(
          blocks.tokenRegistry,
          func(blockType : Nat16, t : Tokens.Token) : (Text, Nat16) {
            (t.cid, blockType);
          },
        );

        let tokenRegistryMap = TrieMap.fromEntries<Text, Nat16>(
          blockTypeFirst.vals(),
          Text.equal,
          Text.hash,
        );

        // Look up the block type by token CID
        tokenRegistryMap.get(Principal.toText(tokenCid));
      };
      case (_) {
        Debug.print("BlocksComponent not found");
        return null;
      };
    };
  };
};
