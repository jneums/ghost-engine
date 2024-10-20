import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Components "../components";
import Blocks "../utils/Blocks";
import Array "mo:base/Array";
import Float "mo:base/Float";
import Map "mo:stable-hash-map/Map/Map";
import Vector3 "../math/Vector3";
import Const "../utils/Const";
import Chunks "../utils/Chunks";

module {
  type ChunkStatus = {
    position : Vector3.Vector3;
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
          Map.set(chunks, Map.thash, debug_show (chunkId), { position = chunkId; isActive = false });
        };

        // Add the chunks with distance < 4 around the spawn point as active chunks
        let spawnPoint = Chunks.getChunkPosition({
          x = Const.SpawnPoint.position.x;
          y = 0;
          z = Const.SpawnPoint.position.z;
        });
        let chunkRange = Float.toInt(Const.DEFAULT_VIEW_RADIUS) / Const.CHUNK_SIZE;

        var x : Int = -chunkRange;
        while (x <= chunkRange) {
          var z : Int = -chunkRange;
          while (z <= chunkRange) {
            let chunkPos = {
              x = (spawnPoint.x + Float.fromInt(x));
              y = 0.0;
              z = (spawnPoint.z + Float.fromInt(z));
            };
            Map.set(chunks, Map.thash, debug_show (chunkPos), { position = chunkPos; isActive = true });
            z += 1;
          };
          x += 1;
        };

        // Iterate over all entities with UnitChunksComponent and set as active chunks
        let unitEntities = ECS.World.getEntitiesByArchetype(ctx, ["UnitChunksComponent"]);
        for (unitEntityId in unitEntities.vals()) {
          switch (ECS.World.getComponent(ctx, unitEntityId, "UnitChunksComponent")) {
            case (? #UnitChunksComponent(unitChunks)) {
              for ({ chunkId } in unitChunks.chunks.vals()) {
                Map.set(chunks, Map.thash, debug_show (chunkId), { position = chunkId; isActive = true });
              };
            };
            case (_) {};
          };
        };

        // Update chunk statuses based on active chunks
        for (chunkStatus in Map.vals(chunks)) {
          if (chunkStatus.isActive) {
            // Generate blocks if they don't exist
            if (Array.size(Blocks.getBlocks(ctx, chunkStatus.position)) == 0) {
              Blocks.generateBlocks(ctx, chunkStatus.position);
            };
          } else {
            // Delete blocks for this chunk
            if (Array.size(Blocks.getBlocks(ctx, chunkStatus.position)) > 0) {
              Blocks.deleteBlocks(ctx, chunkStatus.position);
            };
          };
        };

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
