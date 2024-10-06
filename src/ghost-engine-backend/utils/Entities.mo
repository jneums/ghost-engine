import ECS "mo:geecs";
import Components "../components";
import Array "mo:base/Array";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Terrain "Terrain";
import Const "Const";

module {

  public func filterByRange(ctx : ECS.Types.Context<Components.Component>, playerId : ECS.Types.EntityId) : [ECS.Types.EntityId] {
    switch (ECS.World.getComponent(ctx, playerId, "TransformComponent"), ECS.World.getComponent(ctx, playerId, "PlayerViewComponent")) {
      case (? #TransformComponent(playerTransform), ? #PlayerViewComponent(view)) {
        let floatChunkSize = Float.fromInt(Const.CHUNK_SIZE);
        let playerChunkPos = Terrain.getChunkPosition(playerTransform.position);
        let chunkRange = Float.toInt(view.viewRadius / floatChunkSize);

        let entitiesWithTransform = ECS.World.getEntitiesByArchetype(ctx, ["TransformComponent"]);

        let entities = Array.filter(
          entitiesWithTransform,
          func(entityId : ECS.Types.EntityId) : Bool {
            let transform = ECS.World.getComponent(ctx, entityId, "TransformComponent");
            switch (transform) {
              case (? #TransformComponent(entityTransform)) {
                let entityChunkPos = Terrain.getChunkPosition(entityTransform.position);
                let chunkDistanceX = Int.abs(Float.toInt(entityChunkPos.x - playerChunkPos.x));
                let chunkDistanceZ = Int.abs(Float.toInt(entityChunkPos.z - playerChunkPos.z));
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
