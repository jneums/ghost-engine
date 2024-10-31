import Principal "mo:base/Principal";
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Generate "Generate";
import Game "Game";

actor {
  private stable var gameLoopTimer : ?Timer.TimerId = null;

  // Game loop runs all the systems
  private func gameLoop() : async () {
    switch (await Game.getChunk()) {
      case (?exists) {
        Debug.print("Generating chunk at " # debug_show (exists));
        let position = {
          x = Float.toInt(exists.x);
          y = Float.toInt(exists.y);
          z = Float.toInt(exists.z);
        };
        let blocks = Generate.generateChunkBlocks(position);
        await Game.putChunk(exists, blocks);
      };
      case (_) {};
    };
  };

  private func stopGameLoop() {
    switch (gameLoopTimer) {
      case (?timer) {
        Debug.print("Stopping game loop.");
        Timer.cancelTimer(timer);
        gameLoopTimer := null;
      };
      case (_) {};
    };
  };

  private func startGameLoop<system>() {
    let gameTick = #nanoseconds(1_000_000_000 / 60);
    switch (gameLoopTimer) {
      case (null) {
        Debug.print("Starting game loop.");
        gameLoopTimer := ?Timer.recurringTimer<system>(gameTick, gameLoop);
      };
      case (?exists) {
        Timer.cancelTimer(exists);
        gameLoopTimer := ?Timer.recurringTimer<system>(gameTick, gameLoop);
      };
    };
  };

  startGameLoop<system>();

  public shared ({ caller }) func stop() : async () {
    assert (not Principal.isAnonymous(caller));
    stopGameLoop();
  };

};
