import IcWebSocketCdk "mo:ic-websocket-cdk";
import IcWebSocketCdkState "mo:ic-websocket-cdk/State";
import IcWebSocketCdkTypes "mo:ic-websocket-cdk/Types";
import Debug "mo:base/Debug";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import ECS "ecs";
import Actions "actions";
import { PingSystem } "systems/Ping";
import { MovementSystem } "systems/Movement";
import Messages "messages";

actor {
  // ECS state
  private stable var lastTick : Time.Time = Time.now();
  private stable var entityCounter : Nat = 0;
  private stable var containers = ECS.State.Containers.new();
  private var systemEntities = ECS.State.SystemEntities.new();
  private var systems = ECS.State.SystemRegistry.new();

  // WebSocket state
  let params = IcWebSocketCdkTypes.WsInitParams(null, null);
  let wsState = IcWebSocketCdkState.IcWebSocketState(params);

  func _nextEntityId() : Nat {
    entityCounter += 1;
    entityCounter;
  };

  /// Mutable context that holds all the ECS data
  let ctx : ECS.Types.Context and Messages.Types.Context = {
    containers = containers;
    systemEntities = systemEntities;
    systems = systems;
    nextEntityId = _nextEntityId;
    wsState = wsState;
  };

  /// Register systems
  ECS.Manager.addSystem(ctx, PingSystem);
  ECS.Manager.addSystem(ctx, MovementSystem);

  // Add sample entity and components
  let entity = ECS.Manager.addEntity(ctx);
  ECS.Manager.addComponent(
    ctx,
    entity,
    {
      title = "position";
      data = #Position({ x = 0; y = 0; z = 0 });
    },
  );
  ECS.Manager.addComponent(
    ctx,
    entity,
    {
      title = "velocity";
      data = #Velocity({ x = 1; y = 0; z = 0 });
    },
  );

  /// System loop that updates all the systems in the ECS
  func gameLoop() : async () {
    lastTick := ECS.Manager.update(ctx, lastTick);
  };
  let gameTick = #nanoseconds(1_000_000_000 / 60);
  ignore Timer.recurringTimer<system>(gameTick, gameLoop);

  /// WebSocket setup
  func onOpen(args : IcWebSocketCdk.OnOpenCallbackArgs) : async () {
    let action : Actions.Action = #Connect({
      principal = args.client_principal;
    });
    Actions.handleAction(ctx, action);
  };

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

  func onClose(args : IcWebSocketCdk.OnCloseCallbackArgs) : async () {
    Debug.print("Client " # debug_show (args.client_principal) # " disconnected");
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
