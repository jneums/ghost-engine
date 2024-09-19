import ECS "../ecs";
import Move "Move";
import Connect "Connect";
import T "Types";

module {
  public let Types = T;
  public type Context = ECS.Types.Context;

  public type Action = {
    #Move : Move.Args;
    #Connect : Connect.Args;
  };

  public func handleAction(ctx : Context, action : Action) {
    switch (action) {
      case (#Move(args)) {
        Move.Handler.handle(ctx, args);
      };
      case (#Connect(args)) {
        Connect.Handler.handle(ctx, args);
      };
    };
  };
};
