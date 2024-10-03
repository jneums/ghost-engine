import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Vector "mo:vector";
import Map "mo:stable-hash-map/Map/Map";
import ECS "mo:geecs";

import Actions "actions";
import Components "components";

import Updates "utils/Updates";
import Player "utils/Player";
import Systems "utils/Systems";
import Mines "utils/Mines";

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
  Mines.initialize(ctx);

  // Game loop runs all the systems
  private func gameLoop() : async () {
    // Run all registered systems
    let thisTick = Time.now();
    let deltaTime = thisTick - lastTick;
    await ECS.World.update(ctx, deltaTime);
    lastTick := thisTick;

    // Remove all updates older than 5 seconds
    let fiveSecondsAgo = thisTick - 30 * 1_000_000_000;
    let updated = Updates.filterByTimestamp(ctx.updatedComponents, fiveSecondsAgo);
    Vector.clear(ctx.updatedComponents);

    for (update in Vector.vals(updated)) {
      Vector.add(ctx.updatedComponents, update);
    };

    // Stop game loop if no active players
    let { total } = Player.getActiveSessions(ctx);
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

  // Queries
  public shared query func getState() : async [ECS.Types.Update<Components.Component>] {
    let currentState = Vector.new<ECS.Types.Update<Components.Component>>();
    for ((entityId, components) in Map.entries(ctx.entities)) {
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

  public shared query func getUpdates(since : Time.Time) : async [ECS.Types.Update<Components.Component>] {
    let recent = Updates.filterByTimestamp(ctx.updatedComponents, since);
    let updates = Updates.filterUpdatesForClient(recent);
    Vector.toArray(updates);
  };

  // Mutations
  public shared ({ caller }) func putAction(action : Actions.Action) : async () {
    startGameLoop<system>();
    Player.updateSession(ctx, caller);
    Actions.handleAction(ctx, action);
  };
};
