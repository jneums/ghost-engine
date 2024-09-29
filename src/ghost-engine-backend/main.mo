import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Vector "mo:vector";
import Map "mo:stable-hash-map/Map/Map";
import IcWebSocketCdk "mo:ic-websocket-cdk";
import IcWebSocketCdkState "mo:ic-websocket-cdk/State";
import IcWebSocketCdkTypes "mo:ic-websocket-cdk/Types";
import ECS "mo:geecs";
import Actions "actions";
import Messages "messages";
import { MovementSystem } "systems/MovementSystem";
import { CombatSystem } "systems/CombatSystem";
import { DamageSystem } "systems/DamageSystem";
import { SpawnSystem } "systems/SpawnSystem";
import Components "components";

actor {
  // ECS state
  private stable var lastTick : Time.Time = Time.now();
  private stable var entityCounter : Nat = 0;
  private stable var entities = ECS.State.Entities.new<Components.Component>();
  private var registeredSystems = ECS.State.SystemRegistry.new<Components.Component>();
  private var systemsEntities = ECS.State.SystemsEntities.new();
  private var updatedComponents = ECS.State.UpdatedComponents.new<Components.Component>();
  private var clients = Map.new<Principal, Time.Time>(Map.phash);

  // WebSocket state
  let params = IcWebSocketCdkTypes.WsInitParams(null, null);
  let wsState = IcWebSocketCdkState.IcWebSocketState(params);

  // Context is mutable and shared between all the systems
  let ctx : ECS.Types.Context<Components.Component> and Messages.Types.Context = {
    entities = entities;
    systemsEntities = systemsEntities;
    registeredSystems = registeredSystems;
    updatedComponents = updatedComponents;
    wsState = wsState;

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

  let MAX_MINES = 5;

  // Get current number of mines
  let mines = ECS.World.getEntitiesByArchetype(ctx, ["ResourceComponent"]);
  let numMines = Array.size(mines);
  var minesNeeded = if (MAX_MINES > numMines) { MAX_MINES - numMines : Nat } else {
    0;
  };

  Debug.print("Current mines: " # debug_show (numMines) # " Mines needed: " # debug_show (minesNeeded));

  // Add some mining nodes
  while (minesNeeded > 0) {
    let entityId = ECS.World.addEntity(ctx);
    ECS.World.addComponent(ctx, entityId, "ResourceComponent", #ResourceComponent({ resourceType = "tGENG" }));
    ECS.World.addComponent(ctx, entityId, "NameableComponent", #NameableComponent({ name = "Mining Node" }));
    ECS.World.addComponent(ctx, entityId, "HealthComponent", #HealthComponent({ amount = 3; max = 3 }));
    ECS.World.addComponent(ctx, entityId, "CargoComponent", #CargoComponent({ capacity = 1; current = 1 }));
    ECS.World.addComponent(ctx, entityId, "RespawnComponent", #RespawnComponent({ deathTime = Time.now(); duration = 0 }));
    minesNeeded -= 1;
  };

  // Game loop runs all the systems
  func gameLoop() : async () {
    // Process all the systems
    let thisTick = ECS.World.update(ctx, lastTick);
    let deltaTime = thisTick - lastTick;
    lastTick := thisTick;

    // Iterate through the players and send them the updates
    let updates = Vector.new<ECS.Types.Update<Components.Component>>();

    label filterUpdates for (update in Vector.vals(ctx.updatedComponents)) {
      switch (update) {
        case (#Insert({ component })) {
          switch (component) {
            case (#MoveTargetComponent(_)) {
              continue filterUpdates;
            };
            case (_) {};
          };
        };
        case (#Delete({ componentType })) {
          switch (componentType) {
            case ("MoveTargetComponent") {
              continue filterUpdates;
            };
            case (_) {};
          };
        };
      };
      Vector.add(updates, update);
    };

    let clientUpdates = #Updates(Vector.toArray(updates));

    Debug.print("\n[" # debug_show (deltaTime) # "] " # "Sending " # debug_show (Vector.size(updatedComponents)) # " updates");
    if (Vector.size(updatedComponents) < 1) return;

    for ((client, lastUpdate) in Map.entries(clients)) {
      ignore Messages.Client.send(ctx, client, clientUpdates);
    };

    // Clear the updatedComponents vector
    Vector.clear(updatedComponents);
  };

  let gameTick = #nanoseconds(1_000_000_000 / 60);
  ignore Timer.recurringTimer<system>(gameTick, gameLoop);

  // WebSocket setup

  // Trigger a connection action when a client connects
  func onOpen(args : IcWebSocketCdk.OnOpenCallbackArgs) : async () {
    Map.set(clients, Map.phash, args.client_principal, Time.now());
    let action : Actions.Action = #Connect({
      principal = args.client_principal;
    });
    Actions.handleAction(ctx, action);

    // Send client the current state as an #Updates message
    let updatedComponents = Vector.new<ECS.Types.Update<Components.Component>>();
    for ((entityId, components) in Map.entries(ctx.entities)) {
      for (component in Map.vals(components)) {
        let update = #Insert({
          entityId = entityId;
          component = component;
        });
        Vector.add(updatedComponents, update);
      };
    };

    let updates = #Updates(Vector.toArray(updatedComponents));
    ignore Messages.Client.send(ctx, args.client_principal, updates);
  };

  // Deserialize the action and handle it
  func onMessage(args : IcWebSocketCdk.OnMessageCallbackArgs) : async () {
    let message : ?Actions.Action = from_candid (args.message);
    switch (message) {
      case (?action) {
        Actions.handleAction(ctx, action);
      };
      case (null) {
        Debug.print("Could not deserialize message");
      };
    };
  };

  // Trigger a disconnection action when a client disconnects
  func onClose(args : IcWebSocketCdk.OnCloseCallbackArgs) : async () {
    Map.delete(clients, Map.phash, args.client_principal);
    let action : Actions.Action = #Disconnect({
      principal = args.client_principal;
    });
    Actions.handleAction(ctx, action);
  };

  let handlers = IcWebSocketCdkTypes.WsHandlers(
    ?onOpen,
    ?onMessage,
    ?onClose,
  );
  let ws = IcWebSocketCdk.IcWebSocket(wsState, params, handlers);

  // method called by the WS Gateway after receiving FirstMessage from the client
  public shared ({ caller }) func ws_open(args : IcWebSocketCdk.CanisterWsOpenArguments) : async IcWebSocketCdk.CanisterWsOpenResult {
    await ws.ws_open(caller, args);
  };

  // method called by the Ws Gateway when closing the IcWebSocket connection
  public shared ({ caller }) func ws_close(args : IcWebSocketCdk.CanisterWsCloseArguments) : async IcWebSocketCdk.CanisterWsCloseResult {
    await ws.ws_close(caller, args);
  };

  // method called by the frontend SDK to send a message to the canister
  public shared ({ caller }) func ws_message(args : IcWebSocketCdk.CanisterWsMessageArguments, msg : ?Actions.Action) : async IcWebSocketCdk.CanisterWsMessageResult {
    await ws.ws_message(caller, args, msg);
  };

  // method called by the WS Gateway to get messages for all the clients it serves
  public shared query ({ caller }) func ws_get_messages(args : IcWebSocketCdk.CanisterWsGetMessagesArguments) : async IcWebSocketCdk.CanisterWsGetMessagesResult {
    ws.ws_get_messages(caller, args);
  };
};
