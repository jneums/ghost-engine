import ECS "mo:geecs";
import Components "../components";
import Array "mo:base/Array";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Const "Const";
import Blocks "Blocks";

module {

  public func filterByRange(ctx : ECS.Types.Context<Components.Component>, unitId : ECS.Types.EntityId) : [ECS.Types.EntityId] {
    switch (ECS.World.getComponent(ctx, unitId, "TransformComponent"), ECS.World.getComponent(ctx, unitId, "UnitViewComponent")) {
      case (? #TransformComponent(unitTransform), ? #UnitViewComponent(view)) {
        let floatChunkSize = Float.fromInt(Const.CHUNK_SIZE);
        let unitChunkPos = Blocks.getChunkPosition(unitTransform.position);
        let chunkRange = Float.toInt(view.viewRadius / floatChunkSize);

        let entitiesWithTransform = ECS.World.getEntitiesByArchetype(ctx, ["TransformComponent"]);

        let entities = Array.filter(
          entitiesWithTransform,
          func(entityId : ECS.Types.EntityId) : Bool {
            let transform = ECS.World.getComponent(ctx, entityId, "TransformComponent");
            switch (transform) {
              case (? #TransformComponent(entityTransform)) {
                let entityChunkPos = Blocks.getChunkPosition(entityTransform.position);
                let chunkDistanceX = Int.abs(Float.toInt(entityChunkPos.x - unitChunkPos.x));
                let chunkDistanceZ = Int.abs(Float.toInt(entityChunkPos.z - unitChunkPos.z));
                chunkDistanceX <= chunkRange and chunkDistanceZ <= chunkRange;
              };
              case (_) { false };
            };
          },
        );

        entities;

      };
      case (_) { [] };
    };
  };
};
