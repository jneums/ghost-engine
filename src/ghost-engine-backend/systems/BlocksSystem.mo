import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Components "../components";
import Blocks "../utils/Blocks";
import Array "mo:base/Array";
import Map "mo:stable-hash-map/Map/Map";
import Vector3 "../math/Vector3";

module {
  type ChunkStatus = {
    position : Vector3.Vector3;
    isActive : Bool;
  };

  // Update function for the BlocksSystem
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "BlocksComponent")) {
      case (? #BlocksComponent(blocksComponent)) {
        Debug.print("\nManaging blocks");

        // Track all chunks
        let chunks = Map.new<Text, ChunkStatus>(Map.thash);

        // Add all chunks around the player as inactive chunks
        for (chunkId in blocksComponent.chunkPositions.vals()) {
          Map.set(chunks, Map.thash, debug_show (chunkId), { position = chunkId; isActive = false });
        };

        // Iterate over all entities with PlayerChunksComponent and set as active chunks
        let playerEntities = ECS.World.getEntitiesByArchetype(ctx, ["PlayerChunksComponent"]);
        for (playerEntityId in playerEntities.vals()) {
          switch (ECS.World.getComponent(ctx, playerEntityId, "PlayerChunksComponent")) {
            case (? #PlayerChunksComponent(playerChunks)) {
              for (chunkId in playerChunks.chunks.vals()) {
                Map.set(chunks, Map.thash, debug_show (chunkId), { position = chunkId; isActive = true });
              };
            };
            case (_) {};
          };
        };

        // Update chunk statuses based on active chunks
        for (chunkStatus in Map.vals(chunks)) {
          Debug.print("Chunk: " # debug_show (chunkStatus.position) # " is active: " # debug_show (chunkStatus.isActive));
          if (chunkStatus.isActive) {
            // Generate blocks if they don't exist
            if (Array.size(Blocks.getBlocks(ctx, chunkStatus.position)) == 0) {
              Debug.print("Generating blocks for chunk: " # debug_show (chunkStatus.position));
              Blocks.generateBlocks(ctx, chunkStatus.position);
            };
            Blocks.setStatus(ctx, chunkStatus.position, 1);
          } else {
            // Delete blocks for this chunk
            if (Array.size(Blocks.getBlocks(ctx, chunkStatus.position)) > 0) {
              Debug.print("Deleting blocks for chunk: " # debug_show (chunkStatus.position));
              Blocks.deleteBlocks(ctx, chunkStatus.position);
            };
            Blocks.setStatus(ctx, chunkStatus.position, 0);
          };
        };

        ECS.World.removeComponent(ctx, entityId, "UpdateBlocksComponent");
      };
      case (_) {};
    };
  };

  public let BlocksSystem : ECS.Types.System<Components.Component> = {
    systemType = "BlocksSystem";
    archetype = ["BlocksComponent", "UpdateBlocksComponent"];
    update = update;
  };
};
