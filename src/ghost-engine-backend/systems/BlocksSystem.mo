import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Components "../components";
import Blocks "../utils/Blocks";
import Array "mo:base/Array";
import Vector "mo:vector";
import Nat8 "mo:base/Nat8";
import Option "mo:base/Option";
import Map "mo:stable-hash-map/Map/Map";

module {

  // Update function for the BlocksSystem
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "BlocksComponent")) {
      case (? #BlocksComponent(blocksComponent)) {
        Debug.print("\nManaging blocks");

        // Track all chunks
        let chunks = Map.new<Text, Bool>(Map.thash);

        // Add all chunks around the player as inactive chunks
        for (chunkId in blocksComponent.chunkPositions.vals()) {
          Map.set(chunks, Map.thash, chunkId, false);
        };

        // Iterate over all entities with PlayerChunksComponent and set as active chunks
        let playerEntities = ECS.World.getEntitiesByArchetype(ctx, ["PlayerChunksComponent"]);
        for (playerEntityId in playerEntities.vals()) {
          switch (ECS.World.getComponent(ctx, playerEntityId, "PlayerChunksComponent")) {
            case (? #PlayerChunksComponent(playerChunks)) {
              for (chunkId in playerChunks.chunks.vals()) {
                Map.set(chunks, Map.thash, chunkId, true);
              };
            };
            case (_) {};
          };
        };

        // Update chunk statuses based on active chunks
        for ((chunkId, isActive) in Map.entries(chunks)) {
          if (isActive) {
            // Generate blocks if they don't exist
            if (Array.size(Blocks.getBlocks(ctx, chunkId)) == 0) {
              Debug.print("Generating blocks for chunk: " # chunkId);
              Blocks.generateBlocks(ctx, chunkId);
            };
            Blocks.setStatus(ctx, chunkId, 1);
          } else {
            // Delete blocks for this chunk
            if (Array.size(Blocks.getBlocks(ctx, chunkId)) > 0) {
              Debug.print("Deleting blocks for chunk: " # chunkId);
              Blocks.deleteBlocks(ctx, chunkId);
            };
            Blocks.setStatus(ctx, chunkId, 0);
          };
        };
      };
      case (_) {};
    };
  };

  public let BlocksSystem : ECS.Types.System<Components.Component> = {
    systemType = "BlocksSystem";
    archetype = ["BlocksComponent"];
    update = update;
  };
};
