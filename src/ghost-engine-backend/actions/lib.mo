import ECS "mo:geecs";
import Move "Move";
import Connect "Connect";
import T "Types";
import Disconnect "Disconnect";
import Debug "mo:base/Debug";
import Components "../components";

module {
  public let Types = T;

  public type Action = {
    // Action type for sending update to the clients
    #Updates : [ECS.Types.Update<Components.Component>];

    // Add additional action types here
    #Connect : Connect.Args;
    #Disconnect : Disconnect.Args;
    #Move : Move.Args;
  };

  // Add action handler functions here
  public func handleAction(ctx : T.Context<Components.Component>, action : Action) {
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
      case (#Updates(_)) {
        Debug.print("These actions are sent to the clients...");
      };
    };
  };
};
