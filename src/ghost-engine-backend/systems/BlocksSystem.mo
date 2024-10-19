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

  func getPlayerHasChunk(playerChunks : [{ chunkId : Vector3.Vector3; updatedAt : Time.Time }], chunkId : Vector3.Vector3) : Bool {
    for (playerChunk in playerChunks.vals()) {
      if (Vector3.equal(playerChunk.chunkId, chunkId)) {
        return true;
      };
    };
    return false;
  };

  func updatePlayerChunkTimestamp(ctx : ECS.Types.Context<Components.Component>, playerEntityId : ECS.Types.EntityId, chunkId : Vector3.Vector3) {
    switch (ECS.World.getComponent(ctx, playerEntityId, "PlayerChunksComponent")) {
      case (? #PlayerChunksComponent(playerChunks)) {
        let updatedChunks = Vector.new<Components.PlayersChunk>();
        for (playerChunk in playerChunks.chunks.vals()) {
          if (Vector3.equal(playerChunk.chunkId, chunkId)) {
            Vector.add(updatedChunks, { chunkId = playerChunk.chunkId; updatedAt = Time.now() });
          } else {
            Vector.add(updatedChunks, playerChunk);
          };
        };
        let updatedChunksArray = Vector.toArray(updatedChunks);
        ECS.World.addComponent(ctx, playerEntityId, "PlayerChunksComponent", #PlayerChunksComponent({ chunks = updatedChunksArray }));
      };
      case (_) {};
    };
  };

  // Update function for the BlocksSystem
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "UpdateBlocksComponent")) {
      case (? #UpdateBlocksComponent(update)) {
        Debug.print("\nManaging blocks");

        // Iterate over all entities with PlayerChunksComponent and set as active chunks
        let playerEntities = ECS.World.getEntitiesByArchetype(ctx, ["PlayerChunksComponent"]);
        for (playerEntityId in playerEntities.vals()) {
          switch (ECS.World.getComponent(ctx, playerEntityId, "PlayerChunksComponent")) {
            case (? #PlayerChunksComponent(playerChunks)) {
              for ((blockPosition, value) in update.blocks.vals()) {
                // If the block is in the chunk then set the updatedAt prop on the players "PlayerChunksComponent"
                let chunkId = Chunks.getChunkPosition(blockPosition);
                let playerHasChunk = getPlayerHasChunk(playerChunks.chunks, chunkId);
                if (playerHasChunk) {
                  updatePlayerChunkTimestamp(ctx, playerEntityId, chunkId);
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
