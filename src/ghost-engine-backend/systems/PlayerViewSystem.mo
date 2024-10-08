import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Int "mo:base/Int";
import Vector "mo:vector";
import Components "../components";
import Const "../utils/Const";
import Chunks "../utils/Chunks";
import Blocks "../utils/Blocks";
import Vector3 "../math/Vector3";

module {
  // Generate a list of chunk IDs around the player
  func generateChunkPositions(playerChunkPos : Vector3.Vector3, chunkRange : Int) : [Vector3.Vector3] {
    let chunks = Vector.new<Vector3.Vector3>();
    var x : Int = -chunkRange;
    while (x <= chunkRange) {
      var z : Int = -chunkRange;
      while (z <= chunkRange) {
        let chunkPos = {
          x = (playerChunkPos.x + Float.fromInt(x));
          y = 0.0;
          z = (playerChunkPos.z + Float.fromInt(z));
        };
        Vector.add(chunks, chunkPos);
        z += 1;
      };
      x += 1;
    };
    Vector.toArray(chunks);
  };

  // Update function for the PlayerViewSystem
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "PlayerViewComponent"),
      ECS.World.getComponent(ctx, entityId, "TransformComponent"),
      ECS.World.getComponent(ctx, entityId, "PlayerChunksComponent"),
    ) {
      case (
        ? #PlayerViewComponent(playerView),
        ? #TransformComponent(transform),
        ? #PlayerChunksComponent(_),
      ) {
        Debug.print("\nUpdate chunks around player");

        let floatChunkSize = Float.fromInt(Const.CHUNK_SIZE);
        let playerChunkPos = Chunks.getChunkPosition(transform.position);
        let chunkRange = Float.toInt(playerView.viewRadius / floatChunkSize);

        let newChunkPositions = generateChunkPositions(playerChunkPos, chunkRange);
        let updatedChunks = #PlayerChunksComponent({
          chunks = newChunkPositions;
        });

        ECS.World.addComponent(ctx, entityId, "PlayerChunksComponent", updatedChunks);
        ECS.World.removeComponent(ctx, entityId, "UpdatePlayerChunksComponent");

        // Trigger the BlcoksSystem to update the blocks
        let blocksEntityId = Blocks.getEntityId(ctx);
        Debug.print("Blocks entity ID: " # debug_show (blocksEntityId));
        switch (blocksEntityId) {
          case (?exists) {
            ECS.World.addComponent(ctx, exists, "UpdateBlocksComponent", #UpdateBlocksComponent({}));
          };
          case (_) {};
        };
      };
      case (_) {};
    };
  };

  public let PlayerViewSystem : ECS.Types.System<Components.Component> = {
    systemType = "PlayerViewSystem";
    archetype = ["PlayerViewComponent", "TransformComponent", "PlayerChunksComponent", "UpdatePlayerChunksComponent"];
    update = update;
  };
};
