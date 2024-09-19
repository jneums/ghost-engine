import ECS "../ecs";
import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

module {
  public type Context = ECS.Types.Context;

  public type Args = {
    principal : Principal;
  };

  func handle(ctx : Context, args : Args) {
    Debug.print("\nPlayer connected: " # debug_show (args.principal));
  };

  public let Handler : T.ActionHandler<Context, Args> = {
    handle = handle;
  };
};
