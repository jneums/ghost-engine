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
import Nat8 "mo:base/Nat8";
import Map "mo:stable-hash-map/Map/Map";
import Components "../components";
import Vector3 "../math/Vector3";
import Const "Const";
import Tokens "Tokens";
import TokenRegistry "TokenRegistry";

module {

  public func initialize(ctx : ECS.Types.Context<Components.Component>) {
    if (hasBlocksComponent(ctx)) {
      Debug.print("Blocks already initialized");
      return;
    };
    let entityId = ECS.World.addEntity(ctx);
    let newBlocks = createBlocksComponent();
    ECS.World.addComponent(ctx, entityId, "BlocksComponent", #BlocksComponent(newBlocks));
    ECS.World.addComponent(ctx, entityId, "UpdateChunksComponent", #UpdateChunksComponent({}));
  };

  public func getEntityId(ctx : ECS.Types.Context<Components.Component>) : ?ECS.Types.EntityId {
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) > 0) {
      return ?entityIds[0];
    };
    null;
  };

  public func getBlocks(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3) : [Nat16] {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        getBlocksForChunk(blocks, chunkPos);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
        [];
      };
    };
  };

  public func deleteBlocks(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3) {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        if (Array.size(getBlocks(ctx, chunkPos)) == 0) {
          Debug.print("Blocks already deleted for this chunk position");
          return;
        };
        let updatedBlocks = clearChunk(blocks, chunkPos);
        updateBlocksComponent(ctx, updatedBlocks);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  public func setStatus(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3, status : Nat8) : () {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        updateChunkStatus(ctx, blocks, chunkPos, status);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  // Function to calculate the chunk position from a Vector3 position
  public func getChunkPosition(position : Vector3.Vector3) : Vector3.Vector3 {
    let floatChunkSize = Float.fromInt(Const.CHUNK_SIZE);
    Vector3.floor({
      x = position.x / floatChunkSize;
      y = position.y / floatChunkSize;
      z = position.z / floatChunkSize;
    });
  };

  public func getHighestSolidBlockY(ctx : ECS.Types.Context<Components.Component>, position : Vector3.Vector3) : Float {
    let chunkPos = getChunkPosition(position);
    let blocks = getBlocks(ctx, chunkPos);
    findHighestSolidBlockY(blocks, position);
  };

  public func getBlockType(ctx : ECS.Types.Context<Components.Component>, position : Vector3.Vector3) : Nat16 {
    let chunkPos = getChunkPosition(position);
    let blocks = getBlocks(ctx, chunkPos);
    getBlockTypeAtPosition(blocks, position);
  };

  public func setBlockType(ctx : ECS.Types.Context<Components.Component>, position : Vector3.Vector3, blockType : Nat16) {
    let chunkPos = getChunkPosition(position);
    let blocks = getBlocks(ctx, chunkPos);
    let mutable = Array.thaw<Nat16>(blocks);
    let index = calculateBlockIndex(position);
    if (index >= 0 and Float.toInt(index) < mutable.size()) {
      mutable[Int.abs(Float.toInt(index))] := blockType;
    } else {
      Debug.print("Index out of bounds: " # debug_show (index));
      return;
    };
    updateChangedBlocks(ctx, chunkPos, index, blockType);
  };

  public func getTokenByBlockType(ctx : ECS.Types.Context<Components.Component>, blockType : Nat16) : ?Tokens.Token {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        getTokenFromRegistry(blocks.tokenRegistry, blockType);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
        return null;
      };
    };
  };

  public func registerToken(ctx : ECS.Types.Context<Components.Component>, token : Tokens.Token, offset : Nat8) {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        if (Option.isSome(getTypeByTokenCid(ctx, Principal.fromText(token.cid)))) {
          Debug.print("Token CID already registered");
          return;
        };
        let blockType = findAvailableBlockType(blocks.tokenRegistry, offset);
        let newTokenRegistry = registerTokenInRegistry(blocks.tokenRegistry, blockType, token);
        updateBlocksComponent(ctx, { blocks with tokenRegistry = newTokenRegistry });
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  public func getTypeByTokenCid(ctx : ECS.Types.Context<Components.Component>, tokenCid : Principal) : ?Nat16 {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        getBlockTypeByTokenCid(blocks.tokenRegistry, tokenCid);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
        return null;
      };
    };
  };

  private func hasBlocksComponent(ctx : ECS.Types.Context<Components.Component>) : Bool {
    let blocks = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    Array.size(blocks) > 0;
  };

  private func createBlocksComponent() : Components.BlocksComponent {
    {
      seed = 0 : Nat64;
      chunkPositions = [];
      blockData = [];
      chunkStatus = [];
      changedBlocks = [];
      tokenRegistry = TokenRegistry.GeneratedBlocks;
    };
  };

  private func getBlocksComponent(ctx : ECS.Types.Context<Components.Component>) : ?Components.BlocksComponent {
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      return null;
    };
    switch (ECS.World.getComponent(ctx, entityIds[0], "BlocksComponent")) {
      case (? #BlocksComponent(blocksComponent)) {
        ?blocksComponent;
      };
      case (_) {
        null;
      };
    };
  };

  private func getBlocksForChunk(blocksComponent : Components.BlocksComponent, chunkPos : Vector3.Vector3) : [Nat16] {
    let index = Array.indexOf(chunkPos, blocksComponent.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
    switch (index) {
      case (null) { [] };
      case (?i) {
        let originalBlocks = blocksComponent.blockData[i];
        let mutableBlocks = Array.thaw<Nat16>(originalBlocks);
        if (Array.size(blocksComponent.changedBlocks) < 1 or Array.size(blocksComponent.changedBlocks[i]) < 1) {
          return Array.freeze(mutableBlocks);
        };
        for ((blockIndex, newBlockType) in blocksComponent.changedBlocks[i].vals()) {
          if (blockIndex >= 0 and blockIndex < mutableBlocks.size()) {
            mutableBlocks[blockIndex] := newBlockType;
          };
        };
        Array.freeze(mutableBlocks);
      };
    };
  };

  public func chunkExists(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3) : Bool {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        Array.indexOf(chunkPos, blocks.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b }) != null;
      };
      case (_) {
        Debug.print("BlocksComponent not found");
        false;
      };
    };
  };

  public func createEmptyChunk(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3) {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        let updatedBlocks = {
          blocks with
          chunkPositions = Array.append(blocks.chunkPositions, [chunkPos]);
          blockData = Array.append(blocks.blockData, [[]]);
          chunkStatus = Array.append(blocks.chunkStatus, [255 : Nat8]); // Lowest priority
          changedBlocks = Array.append(blocks.changedBlocks, [[]]);
        };
        updateBlocksComponent(ctx, updatedBlocks);
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  private func clearChunk(blocksComponent : Components.BlocksComponent, chunkPos : Vector3.Vector3) : Components.BlocksComponent {
    let index = Array.indexOf(chunkPos, blocksComponent.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
    switch (index) {
      case (null) { blocksComponent };
      case (?i) {
        var newBlockData = Array.thaw<[Nat16]>(blocksComponent.blockData);
        newBlockData[i] := [];
        { blocksComponent with blockData = Array.freeze(newBlockData) };
      };
    };
  };

  private func updateBlocksComponent(ctx : ECS.Types.Context<Components.Component>, updatedBlocks : Components.BlocksComponent) {
    let entityIds = ECS.World.getEntitiesByArchetype(ctx, ["BlocksComponent"]);
    if (Array.size(entityIds) < 1) {
      Debug.print("BlocksComponent not found");
      return;
    };
    ECS.World.addComponent(ctx, entityIds[0], "BlocksComponent", #BlocksComponent(updatedBlocks));
  };

  private func updateChunkStatus(ctx : ECS.Types.Context<Components.Component>, blocksComponent : Components.BlocksComponent, chunkPos : Vector3.Vector3, status : Nat8) {
    let index = Array.indexOf(chunkPos, blocksComponent.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
    switch (index) {
      case (null) {
        Debug.print("Chunk position not found");
      };
      case (?i) {
        var newChunkStatus = Array.thaw<Nat8>(blocksComponent.chunkStatus);
        newChunkStatus[i] := status;
        let updatedBlocksComponent = {
          blocksComponent with chunkStatus = Array.freeze(newChunkStatus)
        };
        updateBlocksComponent(ctx, updatedBlocksComponent);
      };
    };
  };

  private func findHighestSolidBlockY(blocks : [Nat16], position : Vector3.Vector3) : Float {
    let xIndex = Float.toInt(position.x) % Const.CHUNK_SIZE;
    let zIndex = Float.toInt(position.z) % Const.CHUNK_SIZE;
    var highestY = -1;
    for (y in Iter.range(0, Const.CHUNK_HEIGHT)) {
      let index = xIndex + zIndex * Const.CHUNK_SIZE + y * Const.CHUNK_SIZE * Const.CHUNK_SIZE;
      if (index < Array.size(blocks) and blocks[Int.abs(index)] != 0) {
        highestY := y;
      };
    };
    if (highestY == -1) {
      0.0;
    } else {
      Float.fromInt(highestY);
    };
  };

  private func getBlockTypeAtPosition(blocks : [Nat16], position : Vector3.Vector3) : Nat16 {
    let index = calculateBlockIndex(position);
    if (index >= 0 and Float.toInt(index) < Array.size(blocks)) {
      blocks[Int.abs(Float.toInt(index))];
    } else {
      0;
    };
  };

  private func calculateBlockIndex(position : Vector3.Vector3) : Float {
    let localX = (position.x % Float.fromInt(Const.CHUNK_SIZE) + Float.fromInt(Const.CHUNK_SIZE)) % Float.fromInt(Const.CHUNK_SIZE);
    let localY = (position.y % Float.fromInt(Const.CHUNK_SIZE) + Float.fromInt(Const.CHUNK_SIZE)) % Float.fromInt(Const.CHUNK_SIZE);
    let localZ = (position.z % Float.fromInt(Const.CHUNK_SIZE) + Float.fromInt(Const.CHUNK_SIZE)) % Float.fromInt(Const.CHUNK_SIZE);
    localX + localZ * Float.fromInt(Const.CHUNK_SIZE) + localY * Float.fromInt(Const.CHUNK_SIZE) * Float.fromInt(Const.CHUNK_SIZE);
  };

  private func updateChangedBlocks(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3, index : Float, blockType : Nat16) {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        let chunkIdx = Array.indexOf(chunkPos, blocks.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
        switch (chunkIdx) {
          case (null) {};
          case (?i) {
            let changedChunk = TrieMap.fromEntries<Nat, Nat16>(
              blocks.changedBlocks[i].vals(),
              Nat.equal,
              Map.nhash.0,
            );
            changedChunk.put(Int.abs(Float.toInt(index)), blockType);
            let newChangedChunk = Iter.toArray(changedChunk.entries());
            let newChangedBlocks = Array.thaw<[(Nat, Nat16)]>(blocks.changedBlocks);
            newChangedBlocks[i] := newChangedChunk;
            let updatedBlocksComponent = {
              blocks with changedBlocks = Array.freeze(newChangedBlocks)
            };
            updateBlocksComponent(ctx, updatedBlocksComponent);
          };
        };
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };

  private func getTokenFromRegistry(tokenRegistry : [(Nat16, Tokens.Token)], blockType : Nat16) : ?Tokens.Token {
    let tokenRegistryMap = TrieMap.fromEntries<Nat16, Tokens.Token>(
      tokenRegistry.vals(),
      Nat16.equal,
      func(a : Nat16) : Hash.Hash { Nat32.fromNat16(a) },
    );
    tokenRegistryMap.get(blockType);
  };

  private func findAvailableBlockType(tokenRegistry : [(Nat16, Tokens.Token)], offset : Nat8) : Nat16 {
    var blockType = Nat16.fromNat8(offset) * 1000 : Nat16;
    let tokenRegistryMap = TrieMap.fromEntries<Nat16, Tokens.Token>(
      tokenRegistry.vals(),
      Nat16.equal,
      func(a : Nat16) : Hash.Hash { Nat32.fromNat16(a) },
    );
    label findHighest for (i in Iter.range(1000, 65535)) {
      if (Option.isNull(tokenRegistryMap.get(Nat16.fromNat(i)))) {
        blockType := Nat16.fromNat(i);
        break findHighest;
      };
    };
    blockType;
  };

  private func registerTokenInRegistry(tokenRegistry : [(Nat16, Tokens.Token)], blockType : Nat16, token : Tokens.Token) : [(Nat16, Tokens.Token)] {
    let tokenRegistryMap = TrieMap.fromEntries<Nat16, Tokens.Token>(
      tokenRegistry.vals(),
      Nat16.equal,
      func(a : Nat16) : Hash.Hash { Nat32.fromNat16(a) },
    );
    tokenRegistryMap.put(blockType, token);
    Iter.toArray(tokenRegistryMap.entries());
  };

  private func getBlockTypeByTokenCid(tokenRegistry : [(Nat16, Tokens.Token)], tokenCid : Principal) : ?Nat16 {
    let blockTypeFirst = Array.map<(Nat16, Tokens.Token), (Text, Nat16)>(
      tokenRegistry,
      func(blockType : Nat16, t : Tokens.Token) : (Text, Nat16) {
        (t.cid, blockType);
      },
    );
    let tokenRegistryMap = TrieMap.fromEntries<Text, Nat16>(
      blockTypeFirst.vals(),
      Text.equal,
      Text.hash,
    );
    tokenRegistryMap.get(Principal.toText(tokenCid));
  };

  public func getTokenRegistry(ctx : ECS.Types.Context<Components.Component>) : Components.TokenRegistry {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        blocks.tokenRegistry;
      };
      case (_) {
        Debug.print("BlocksComponent not found");
        TokenRegistry.GeneratedBlocks;
      };
    };
  };

  public func getChunkToGenerate(ctx : ECS.Types.Context<Components.Component>) : ?Vector3.Vector3 {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        var highestPriorityChunk : ?Vector3.Vector3 = null;
        var highestPriority : Nat8 = 254; // Start with the lowest possible priority
        let chunkStatusSize = Array.size(blocks.chunkStatus);

        label findHighest for (chunkIdx in Iter.range(0, chunkStatusSize - 1)) {
          let status = blocks.chunkStatus[chunkIdx];
          if (status >= highestPriority) {
            continue findHighest; // Skip if the status is not higher priority
          };

          let chunkPos = blocks.chunkPositions[chunkIdx];
          if (Array.size(blocks.blockData[chunkIdx]) == 0) {
            highestPriority := status;
            highestPriorityChunk := ?chunkPos;

            // Early exit if we find the highest priority (0)
            if (status == 0) {
              break findHighest;
            };
          };
        };

        highestPriorityChunk;
      };
      case (_) {
        Debug.print("BlocksComponent not found");
        null;
      };
    };
  };

  public func putGeneratedChunk(ctx : ECS.Types.Context<Components.Component>, chunkPos : Vector3.Vector3, generatedBlocks : [Nat16]) {
    switch (getBlocksComponent(ctx)) {
      case (?blocks) {
        let index = Array.indexOf(chunkPos, blocks.chunkPositions, func(a : Vector3.Vector3, b : Vector3.Vector3) : Bool { a == b });
        switch (index) {
          case (null) {
            // Add new entry if the chunk position is not already present
            let updatedBlocksComponent = {
              seed = blocks.seed;
              chunkPositions = Array.append(blocks.chunkPositions, [chunkPos]);
              blockData = Array.append(blocks.blockData, [generatedBlocks]);
              chunkStatus = Array.append(blocks.chunkStatus, [255 : Nat8]); // Lowest priority
              changedBlocks = Array.append(blocks.changedBlocks, [[]]);
              tokenRegistry = blocks.tokenRegistry;
            };
            updateBlocksComponent(ctx, updatedBlocksComponent);
          };
          case (?i) {
            // Update existing entry
            var newBlockData = Array.thaw<[Nat16]>(blocks.blockData);
            newBlockData[i] := generatedBlocks;
            var newChunkStatus = Array.thaw<Nat8>(blocks.chunkStatus);
            newChunkStatus[i] := 255; // Lowest priority
            let updatedBlocksComponent = {
              seed = blocks.seed;
              chunkPositions = blocks.chunkPositions;
              blockData = Array.freeze(newBlockData);
              chunkStatus = Array.freeze(newChunkStatus);
              changedBlocks = blocks.changedBlocks;
              tokenRegistry = blocks.tokenRegistry;
            };
            updateBlocksComponent(ctx, updatedBlocksComponent);
          };
        };
      };
      case (_) {
        Debug.print("BlocksComponent not found");
      };
    };
  };
};
