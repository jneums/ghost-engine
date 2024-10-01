import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Vector "mo:vector";
import Map "mo:stable-hash-map/Map/Map";
import ECS "mo:geecs";
import Actions "actions";
import { MovementSystem } "systems/MovementSystem";
import { CombatSystem } "systems/CombatSystem";
import { DamageSystem } "systems/DamageSystem";
import { SpawnSystem } "systems/SpawnSystem";
import { RewardSystem } "systems/RewardSystem";
import { ConnectSystem } "systems/ConnectSystem";
import { DisconnectSystem } "systems/DisconnectSystem";
import Components "components";
import Updates "utils/Updates";

actor {
  // ECS state
  private stable var lastTick : Time.Time = Time.now();
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

  // Register systems here
  ECS.World.addSystem(ctx, MovementSystem);
  ECS.World.addSystem(ctx, SpawnSystem);
  ECS.World.addSystem(ctx, CombatSystem);
  ECS.World.addSystem(ctx, DamageSystem);
  ECS.World.addSystem(ctx, RewardSystem);
  ECS.World.addSystem(ctx, ConnectSystem);
  ECS.World.addSystem(ctx, DisconnectSystem);

  // Add some mining nodes
  let MAX_MINES = 5;

  // Get current number of mines
  let mines = ECS.World.getEntitiesByArchetype(ctx, ["ResourceComponent"]);
  let numMines = Array.size(mines);
  var minesNeeded = if (MAX_MINES > numMines) { MAX_MINES - numMines : Nat } else {
    0;
  };

  Debug.print("Current mines: " # debug_show (numMines) # " Mines needed: " # debug_show (minesNeeded));

  while (minesNeeded > 0) {
    let entityId = ECS.World.addEntity(ctx);
    ECS.World.addComponent(ctx, entityId, "ResourceComponent", #ResourceComponent({ resourceType = "tENGINE" }));
    ECS.World.addComponent(ctx, entityId, "NameableComponent", #NameableComponent({ name = "tENGINE Block" }));
    ECS.World.addComponent(ctx, entityId, "HealthComponent", #HealthComponent({ amount = 3; max = 3 }));
    ECS.World.addComponent(ctx, entityId, "RespawnComponent", #RespawnComponent({ deathTime = Time.now(); duration = 0 }));
    minesNeeded -= 1;
  };

  // Game loop runs all the systems
  func gameLoop() : async () {
    // Process all systems and save delta time
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
  };

  let gameTick = #nanoseconds(1_000_000_000 / 60);
  ignore Timer.recurringTimer<system>(gameTick, gameLoop);

  // Get state
  public shared query func getState() : async [ECS.Types.Update<Components.Component>] {
    // Send client the current state as an #Updates message
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

    // Filter out server only components
    let updates = Updates.filterUpdatesForClient(currentState);
    Vector.toArray(updates);
  };

  public shared query func getUpdates(since : Time.Time) : async [ECS.Types.Update<Components.Component>] {
    // Send client the current state as an #Updates message
    let recent = Updates.filterByTimestamp(ctx.updatedComponents, since);

    // Filter out server only components
    let updates = Updates.filterUpdatesForClient(recent);
    Vector.toArray(updates);
  };

  // Actions
  public shared func putAction(action : Actions.Action) : async () {
    Actions.handleAction(ctx, action);
  };
};
