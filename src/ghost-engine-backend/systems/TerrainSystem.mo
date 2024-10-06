import ECS "mo:geecs";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Nat8 "mo:base/Nat8";
import Int "mo:base/Int";
import Vector "mo:vector";
import Components "../components";
import Const "../utils/Const";
import Terrain "../utils/Terrain";
import Blocks "../utils/Blocks";

module {

  // Update function for the TerrainSystem
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "PlayerViewComponent"),
      ECS.World.getComponent(ctx, entityId, "TransformComponent"),
      ECS.World.getComponent(ctx, entityId, "ChunksComponent"),
    ) {
      case (
        ? #PlayerViewComponent(playerView),
        ? #TransformComponent(transform),
        ? #ChunksComponent(chunksComponent),
      ) {

        Debug.print("\nUpdate chunks around player");
        let floatChunkSize = Float.fromInt(Const.CHUNK_SIZE);
        // Calculate the player's current chunk position
        let playerChunkPos = Terrain.getChunkPosition(transform.position);

        // Define the range of chunks to check around the player
        let chunkRange = Float.toInt(playerView.viewRadius / floatChunkSize);

        // Track chunks that should be present
        let chunks = Vector.new<Text>();

        var x : Int = -chunkRange;
        while (x <= chunkRange) {
          var z : Int = -chunkRange;
          while (z <= chunkRange) {
            let chunkPos = {
              x = (playerChunkPos.x + Float.fromInt(x));
              y = 0.0;
              z = (playerChunkPos.z + Float.fromInt(z));
            };

            // Convert chunk position to a text key
            let chunkId = Blocks.blockIdFromVector3(chunkPos);

            // Add chunk position to the list of chunks to add
            Vector.add(chunks, chunkId);

            // Increment the z index
            z += 1;
          };
          // Increment the x index
          x += 1;
        };

        let updatedChunks = #ChunksComponent({
          chunks = Vector.toArray(chunks);
        });

        // Update the ChunksComponent with the new list of chunks
        ECS.World.addComponent(ctx, entityId, "ChunksComponent", updatedChunks);

        // Remove the tag after processing
        ECS.World.removeComponent(ctx, entityId, "UpdateChunksComponent");
      };
      case (_) {};
    };
  };

  public let TerrainSystem : ECS.Types.System<Components.Component> = {
    systemType = "TerrainSystem";
    archetype = ["PlayerViewComponent", "TransformComponent", "ChunksComponent", "UpdateChunksComponent"];
    update = update;
  };
};
