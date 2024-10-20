import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Components "../components";
import Vector3 "../math/Vector3";
import Vector "mo:vector";
import Chunks "../utils/Chunks";

module {
  // Define a component for updating blocks
  public type UpdateBlocksComponent = {
    blocks : [Components.BlockUpdate];
  };

  func getUnitHasChunk(unitChunks : [{ chunkId : Vector3.Vector3; updatedAt : Time.Time }], chunkId : Vector3.Vector3) : Bool {
    for (unitChunk in unitChunks.vals()) {
      if (Vector3.equal(unitChunk.chunkId, chunkId)) {
        return true;
      };
    };
    return false;
  };

  func updateUnitChunkTimestamp(ctx : ECS.Types.Context<Components.Component>, unitEntityId : ECS.Types.EntityId, chunkId : Vector3.Vector3) {
    switch (ECS.World.getComponent(ctx, unitEntityId, "UnitChunksComponent")) {
      case (? #UnitChunksComponent(unitChunks)) {
        let updatedChunks = Vector.new<Components.UnitsChunk>();
        for (unitChunk in unitChunks.chunks.vals()) {
          if (Vector3.equal(unitChunk.chunkId, chunkId)) {
            Vector.add(updatedChunks, { chunkId = unitChunk.chunkId; updatedAt = Time.now() });
          } else {
            Vector.add(updatedChunks, unitChunk);
          };
        };
        let updatedChunksArray = Vector.toArray(updatedChunks);
        ECS.World.addComponent(ctx, unitEntityId, "UnitChunksComponent", #UnitChunksComponent({ chunks = updatedChunksArray }));
      };
      case (_) {};
    };
  };

  // Update function for the BlocksSystem
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "UpdateBlocksComponent")) {
      case (? #UpdateBlocksComponent(update)) {
        Debug.print("\nManaging blocks");

        // Iterate over all entities with UnitChunksComponent and set as active chunks
        let unitEntities = ECS.World.getEntitiesByArchetype(ctx, ["UnitChunksComponent"]);
        for (unitEntityId in unitEntities.vals()) {
          switch (ECS.World.getComponent(ctx, unitEntityId, "UnitChunksComponent")) {
            case (? #UnitChunksComponent(unitChunks)) {
              for ((blockPosition, value) in update.blocks.vals()) {
                // If the block is in the chunk then set the updatedAt prop on the units "UnitChunksComponent"
                let chunkId = Chunks.getChunkPosition(blockPosition);
                let unitHasChunk = getUnitHasChunk(unitChunks.chunks, chunkId);
                if (unitHasChunk) {
                  updateUnitChunkTimestamp(ctx, unitEntityId, chunkId);
                };
              };
            };
            case (_) {};
          };
        };

        // Remove the UpdateBlocksComponent after processing
        ECS.World.removeComponent(ctx, entityId, "UpdateBlocksComponent");
      };
      case (_) {};
    };
  };

  public let BlocksSystem : ECS.Types.System<Components.Component> = {
    systemType = "BlocksSystem";
    archetype = ["UpdateBlocksComponent"];
    update = update;
  };
};
