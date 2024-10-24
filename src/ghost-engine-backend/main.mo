import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat16 "mo:base/Nat16";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Vector "mo:vector";
import Map "mo:stable-hash-map/Map/Map";
import ECS "mo:geecs";
import Actions "actions";
import Components "components";
import Updates "utils/Updates";
import Units "utils/Units";
import Systems "systems/Systems";
import Blocks "utils/Blocks";
import Vector3 "math/Vector3";
import Entities "utils/Entities";

actor {
  // ECS state
  private stable var lastTick : Time.Time = Time.now();
  private stable var gameLoopTimer : ?Timer.TimerId = null;
  private stable var gameLoopUpdatedAt : Time.Time = Time.now();
  private stable var totalGameTime : Time.Time = 0;
  private stable var totalSleepTime : Time.Time = 0;
  private stable var entityCounter : Nat = 0;
  private stable var entities = ECS.State.Entities.new<Components.Component>();
  private var registeredSystems = ECS.State.SystemRegistry.new<Components.Component>();
  private var systemsEntities = ECS.State.SystemsEntities.new();
  private var updatedComponents = ECS.State.UpdatedComponents.new<Components.Component>();

  // Context is mutable and shared between all systems
  let ctx : ECS.Types.Context<Components.Component> = {
    // ECS context
    entities = entities;
    systemsEntities = systemsEntities;
    registeredSystems = registeredSystems;
    updatedComponents = updatedComponents;

    // Incrementing entity counter for ids.
    nextEntityId = func() : Nat {
      entityCounter += 1;
      entityCounter;
    };
  };

  // Initialization
  Systems.register(ctx);
  Blocks.initialize(ctx);

  // Game loop runs all the systems
  private func gameLoop() : async () {
    // Run all registered systems
    let thisTick = Time.now();
    let deltaTime = thisTick - lastTick;
    await ECS.World.update(ctx, deltaTime);
    lastTick := thisTick;

    // Remove all updates older than 30 seconds
    let expiresAfter = thisTick - 30 * 1_000_000_000;
    let updated = Updates.filterByTimestamp(ctx.updatedComponents, expiresAfter);
    Vector.clear(ctx.updatedComponents);

    for (update in Vector.vals(updated)) {
      Vector.add(ctx.updatedComponents, update);
    };

    // Stop game loop if no active units
    let { total } = Units.getActiveSessions(ctx);
    if (total < 1) {
      stopGameLoop();
    };
  };

  private func stopGameLoop() {
    switch (gameLoopTimer) {
      case (?timer) {
        Debug.print("Stopping game loop. Total run time was " # debug_show (Time.now() - gameLoopUpdatedAt) # " nanoseconds");
        Timer.cancelTimer(timer);
        gameLoopTimer := null;
        totalGameTime += Time.now() - gameLoopUpdatedAt;
        gameLoopUpdatedAt := Time.now();
      };
      case (_) {};
    };
  };

  private func startGameLoop<system>() {
    let gameTick = #nanoseconds(1_000_000_000 / 60);
    switch (gameLoopTimer) {
      case (null) {
        Debug.print("Starting game loop. Total sleep time was " # debug_show (Time.now() - gameLoopUpdatedAt) # " nanoseconds");
        gameLoopTimer := ?Timer.recurringTimer<system>(gameTick, gameLoop);
        gameLoopUpdatedAt := Time.now();
        totalSleepTime += Time.now() - gameLoopUpdatedAt;
      };
      case (?exists) {
        Timer.cancelTimer(exists);
        gameLoopTimer := ?Timer.recurringTimer<system>(gameTick, gameLoop);
      };
    };
  };

  startGameLoop<system>();

  // Queries
  public shared query ({ caller }) func getState() : async [ECS.Types.Update<Components.Component>] {
    assert (not Principal.isAnonymous(caller));

    switch (Units.getEntityId(ctx, caller)) {
      case (?exists) {
        let currentState = Vector.new<ECS.Types.Update<Components.Component>>();
        let entities = Entities.filterByRange(ctx, exists);
        for (entityId in entities.vals()) {
          let components = ECS.World.getEntity(ctx, entityId);
          for (component in Map.vals(components)) {
            let update = #Insert({
              timestamp = Time.now();
              entityId = entityId;
              component = component;
            });
            Vector.add(currentState, update);
          };
        };

        let updates = Updates.filterUpdatesForClient(currentState);
        Vector.toArray(updates);
      };
      case (null) { return [] };
    };
  };

  public shared query ({ caller }) func getUpdates(since : Time.Time) : async [ECS.Types.Update<Components.Component>] {
    assert (not Principal.isAnonymous(caller));

    switch (Units.getEntityId(ctx, caller)) {
      case (?exists) {
        let entities = Entities.filterByRange(ctx, exists);
        let filtered = Updates.filterByEntities(ctx.updatedComponents, entities);
        let recent = Updates.filterByTimestamp(filtered, since);
        let updates = Updates.filterUpdatesForClient(recent);
        Vector.toArray(updates);
      };
      case (null) { return [] };
    };
  };

  // Get block data for chunks
  public shared query ({ caller }) func getChunks(chunkIds : [Vector3.Vector3]) : async [[Nat16]] {
    assert (not Principal.isAnonymous(caller));

    let results = Array.init<[Nat16]>(chunkIds.size(), []);
    var idx = 0;
    for (chunkId in chunkIds.vals()) {
      let blocks = if (Units.hasChunk(ctx, caller, chunkId)) {
        Blocks.getBlocks(ctx, chunkId);
      } else {
        [];
      };
      results[idx] := blocks;
      idx += 1;
    };

    Array.freeze(results);
  };

  // Mutations
  public shared ({ caller }) func putAction(action : Actions.Action) : async () {
    assert (not Principal.isAnonymous(caller));

    startGameLoop<system>();
    Units.updateSession(ctx, caller);
    Actions.handleAction(ctx, action);
  };
};
