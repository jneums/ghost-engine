import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Vector "mo:vector";
import Map "mo:stable-hash-map/Map/Map";
import IcWebSocketCdk "mo:ic-websocket-cdk";
import IcWebSocketCdkState "mo:ic-websocket-cdk/State";
import IcWebSocketCdkTypes "mo:ic-websocket-cdk/Types";
import ECS "ecs";
import Actions "actions";
import { MovementSystem } "systems/Movement";
import Messages "messages";

actor {
  // ECS state
  private stable var lastTick : Time.Time = Time.now();
  private stable var entityCounter : Nat = 0;
  private stable var containers = ECS.State.Containers.new();
  private var systemEntities = ECS.State.SystemEntities.new();
  private var systems = ECS.State.SystemRegistry.new();
  private var updated = ECS.State.Updated.new();
  private var clients = Map.new<Principal, Time.Time>(Map.phash);

  // WebSocket state
  let params = IcWebSocketCdkTypes.WsInitParams(null, null);
  let wsState = IcWebSocketCdkState.IcWebSocketState(params);

  /// Context is mutable and shared between all the systems
  let ctx : ECS.Types.Context and Messages.Types.Context = {
    containers = containers;
    systemEntities = systemEntities;
    systems = systems;
    updated = updated;
    wsState = wsState;

    /// Incrementing entity counter for ids.
    /// Text instead of Nat to allow for creating and accessing entities deterministically.
    nextEntityId = func() : ECS.Types.EntityId {
      entityCounter += 1;
      Nat.toText(entityCounter);
    };
  };

  /// Register systems here
  ECS.Manager.addSystem(ctx, MovementSystem);

  /// Game loop runs all the systems
  func gameLoop() : async () {
    lastTick := ECS.Manager.update(ctx, lastTick);

    /// Iterate through all updates and send them to clients
    for ((client, lastUpdate) in Map.entries(clients)) {
      for (update in Iter.fromArray(Vector.toArray(updated))) {
        ignore Messages.Client.send(ctx, client, update);
      };
    };

    /// Clear the updated vector
    Vector.clear(updated);
  };
  let gameTick = #nanoseconds(1_000_000_000 / 60);
  ignore Timer.recurringTimer<system>(gameTick, gameLoop);

  /// WebSocket setup

  /// Trigger a connection action when a client connects
  func onOpen(args : IcWebSocketCdk.OnOpenCallbackArgs) : async () {
    Map.set(clients, Map.phash, args.client_principal, Time.now());
    let action : Actions.Action = #Connect({
      principal = args.client_principal;
    });
    Actions.handleAction(ctx, action);
  };

  /// Deserialize the action and handle it
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

  /// Trigger a disconnection action when a client disconnects
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
