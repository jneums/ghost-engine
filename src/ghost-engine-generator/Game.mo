import env "env";

module {
  public type ChunkPosition = {
    x : Float;
    y : Float;
    z : Float;
  };

  public type Service = actor {
    getChunkToGenerate : () -> async ?ChunkPosition;
    putGeneratedChunk : (ChunkPosition, [Nat16]) -> async ();
  };

  public func getChunk() : async ?ChunkPosition {
    let game = actor (env.CANISTER_ID_GHOST_ENGINE_BACKEND) : Service;
    await game.getChunkToGenerate();
  };

  public func putChunk(chunk : ChunkPosition, blocks : [Nat16]) : async () {
    let game = actor (env.CANISTER_ID_GHOST_ENGINE_BACKEND) : Service;
    await game.putGeneratedChunk(chunk, blocks);
  };
};
