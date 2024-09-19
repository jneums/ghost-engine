import Move "Move";
import Connect "Connect";
import T "Types";
import Disconnect "Disconnect";
import Debug "mo:base/Debug";
import Container "../container";
import ECS "../ecs";

module {
  public let Types = T;

  public type Action = {
    /// Add additional action types here
    #Connect : Connect.Args;
    #Disconnect : Disconnect.Args;
    #Move : Move.Args;

    /// Action types for sending update to the clients
    #Insert : {
      entityId : ECS.Types.EntityId;
      component : Container.Types.Component;
    };
    #Delete : {
      entityId : ECS.Types.EntityId;
      componentType : Container.Types.ComponentType;
    };
  };

  /// Add action handler functions here
  public func handleAction(ctx : T.Context, action : Action) {
    switch (action) {
      case (#Connect(args)) {
        Connect.Handler.handle(ctx, args);
      };
      case (#Disconnect(args)) {
        Disconnect.Handler.handle(ctx, args);
      };
      case (#Move(args)) {
        Move.Handler.handle(ctx, args);
      };
      case (#Insert(_) or #Delete(_)) {
        Debug.print("These actions are sent to the clients...");
      };
    };
  };
};
