import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Components "../../components";
import Vector3 "../../math/Vector3";
import Vector "mo:vector";

module {
  // Define a component for updating blocks
  // public type UpdateBlocksComponent = {
  //   blocks : [{ chunkId : Vector3.Vector3; localIdx : Nat; value : Nat8 }];
  // };

  // public type PlayerChunksComponent = {
  //   chunks : [{ chunkId : Vector3.Vector3; updatedAt : Time.Time }]; // List of chunk positions
  // };

  public type Chunk = {
    chunkId : Vector3.Vector3;
    updatedAt : Time.Time;
  };

  func getUpdatedChunks(blocks : [{ chunkId : Vector3.Vector3; localIdx : Nat; value : Nat8 }]) : [{
    chunkId : Vector3.Vector3;
    updatedAt : Time.Time;
  }] {
    let updatedChunks = Vector.new<Chunk>();

    for (block in blocks.vals()) {
      let chunkId = block.chunkId;
      let updatedAt = Time.now();

      // Check if the chunk is already in the updatedChunks array
      var chunkExists = false;
      label findChunk for (updatedChunk in Vector.vals(updatedChunks)) {
        if (Vector3.equal(updatedChunk.chunkId, chunkId)) {
          chunkExists := true;
          break findChunk;
        };
      };

      // If the chunk is not in the updatedChunks array, add it
      if (not chunkExists) {
        Vector.add(updatedChunks, { chunkId = chunkId; updatedAt = updatedAt });
      };
    };

    Vector.toArray(updatedChunks);
  };

  // Update function for the BlocksSystem
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "BlocksComponent"), ECS.World.getComponent(ctx, entityId, "UpdateBlocksComponent")) {
      case (? #BlocksComponent(blocks), ? #UpdateBlocksComponent(update)) {
        Debug.print("\nManaging blocks");

        // Iterate over all entities with PlayerChunksComponent
        let playerEntities = ECS.World.getEntitiesByArchetype(ctx, ["PlayerChunksComponent"]);
        for (playerEntityId in playerEntities.vals()) {
          switch (ECS.World.getComponent(ctx, playerEntityId, "PlayerChunksComponent")) {
            case (? #PlayerChunksComponent(playerChunks)) {
              var updatedChunks = getUpdatedChunks(update.blocks);

              // Check each block update against the player's chunks
              for (blockUpdate in update.blocks.vals()) {
                for (chunk in playerChunks.chunks.vals()) {
                  if (Vector3.equal(chunk.chunkId, blockUpdate.chunkId)) {
                    // Update the updatedAt property for the affected chunk
                    updatedChunks := Array.map(
                      updatedChunks,
                      func(c : { chunkId : Vector3.Vector3; updatedAt : Time.Time }) : {
                        chunkId : Vector3.Vector3;
                        updatedAt : Time.Time;
                      } {
                        if (Vector3.equal(c.chunkId, blockUpdate.chunkId)) {
                          { chunkId = c.chunkId; updatedAt = Time.now() };
                        } else {
                          c;
                        };
                      },
                    );
                  };
                };
              };

              // Update the PlayerChunksComponent with the new timestamps
              let updatedPlayerChunks = #PlayerChunksComponent({
                chunks = updatedChunks;
              });
              ECS.World.addComponent(ctx, playerEntityId, "PlayerChunksComponent", updatedPlayerChunks);
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
    archetype = ["BlocksComponent", "UpdateBlocksComponent"];
    update = update;
  };
};
