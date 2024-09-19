import Move "Move";
import Connect "Connect";
import T "Types";
import Disconnect "Disconnect";

module {
  public let Types = T;

  /// Add action types here
  public type Action = {
    #Connect : Connect.Args;
    #Disconnect : Disconnect.Args;
    #Move : Move.Args;
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
    };
  };
};
