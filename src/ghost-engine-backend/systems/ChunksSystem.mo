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
    priority : Nat8;
    isActive : Bool;
  };

  // Update function for the ChunksSystem
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "BlocksComponent")) {
      case (? #BlocksComponent(blocksComponent)) {
        Debug.print("\nManaging blocks");

        // Track all chunks
        let chunks = Map.new<Text, ChunkStatus>(Map.thash);

        // Add all chunks as inactive
        for (chunkId in blocksComponent.chunkPositions.vals()) {
          Map.set(chunks, Map.thash, debug_show (chunkId), { position = chunkId; priority = 0 : Nat8; isActive = false });
        };

        // Iterate over all entities with UnitChunksComponent and set as active chunks
        let unitEntities = ECS.World.getEntitiesByArchetype(ctx, ["UnitChunksComponent"]);
        for (unitEntityId in unitEntities.vals()) {
          switch (ECS.World.getComponent(ctx, unitEntityId, "UnitChunksComponent")) {
            case (? #UnitChunksComponent(unitChunks)) {
              for ({ chunkId; priority } in unitChunks.chunks.vals()) {
                Map.set(chunks, Map.thash, debug_show (chunkId), { position = chunkId; priority; isActive = true });
              };
            };
            case (_) {};
          };
        };

        for (chunkStatus in Map.vals(chunks)) {
          if (chunkStatus.isActive) {
            // Check if blocks exist
            if (Array.size(Blocks.getBlocks(ctx, chunkStatus.position)) == 0) {
              // Set placeholder if no blocks exist
              if (not Blocks.chunkExists(ctx, chunkStatus.position)) {
                Blocks.createEmptyChunk(ctx, chunkStatus.position);
              };
              // Set the status to indicate pending generation
              Blocks.setStatus(ctx, chunkStatus.position, chunkStatus.priority);
            };
          };
        };

        Debug.print("\nChunks managed");
        ECS.World.removeComponent(ctx, entityId, "UpdateChunksComponent");

      };
      case (_) {};
    };
  };

  public let ChunksSystem : ECS.Types.System<Components.Component> = {
    systemType = "ChunksSystem";
    archetype = ["BlocksComponent", "UpdateChunksComponent"];
    update = update;
  };
};
