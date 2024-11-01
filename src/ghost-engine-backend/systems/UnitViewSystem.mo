import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Int "mo:base/Int";
import Nat8 "mo:base/Nat8";
import Vector "mo:vector";
import Components "../components";
import Const "../utils/Const";
import Blocks "../utils/Blocks";
import Vector3 "../math/Vector3";

module {
  // Generate a list of chunk IDs around the unit
  func generateChunkPositions(unitChunkPos : Vector3.Vector3, chunkRange : Int) : [Components.UnitsChunk] {
    let chunks = Vector.new<Components.UnitsChunk>();
    var x : Int = -chunkRange;
    while (x <= chunkRange) {
      var z : Int = -chunkRange;
      while (z <= chunkRange) {
        let newChunkPos = {
          x = (unitChunkPos.x + Float.fromInt(x));
          y = 0.0;
          z = (unitChunkPos.z + Float.fromInt(z));
        };
        let distance = Vector3.distance(unitChunkPos, newChunkPos);

        let chunkPos = {
          chunkId = newChunkPos;
          priority = Nat8.fromNat(Int.abs(Float.toInt(distance)));
          updatedAt = 0;
        };
        Vector.add(chunks, chunkPos);
        z += 1;
      };
      x += 1;
    };
    Vector.toArray(chunks);
  };

  // Update function for the UnitViewSystem
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "UnitViewComponent"),
      ECS.World.getComponent(ctx, entityId, "TransformComponent"),
      ECS.World.getComponent(ctx, entityId, "UnitChunksComponent"),
    ) {
      case (
        ? #UnitViewComponent(unitView),
        ? #TransformComponent(transform),
        ? #UnitChunksComponent(_),
      ) {
        Debug.print("\nUpdate chunks around unit");

        let floatChunkSize = Float.fromInt(Const.CHUNK_SIZE);
        let unitChunkPos = Blocks.getChunkPosition(transform.position);
        let chunkRange = Float.toInt(unitView.viewRadius / floatChunkSize);

        let newChunkPositions = generateChunkPositions(unitChunkPos, chunkRange);
        let updatedChunks = #UnitChunksComponent({
          chunks = newChunkPositions;
        });

        ECS.World.addComponent(ctx, entityId, "UnitChunksComponent", updatedChunks);
        ECS.World.removeComponent(ctx, entityId, "UpdateUnitChunksComponent");

        // Trigger the BlcoksSystem to update the blocks
        let blocksEntityId = Blocks.getEntityId(ctx);
        Debug.print("Blocks entity ID: " # debug_show (blocksEntityId));
        switch (blocksEntityId) {
          case (?exists) {
            ECS.World.addComponent(ctx, exists, "UpdateChunksComponent", #UpdateChunksComponent({}));
          };
          case (_) {};
        };
      };
      case (_) {};
    };
  };

  public let UnitViewSystem : ECS.Types.System<Components.Component> = {
    systemType = "UnitViewSystem";
    archetype = ["UnitViewComponent", "TransformComponent", "UnitChunksComponent", "UpdateUnitChunksComponent"];
    update = update;
  };
};
