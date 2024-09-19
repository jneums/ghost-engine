import ECS "../ecs";
import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

module {
  public type Args = {
    principal : Principal;
  };

  func handle(ctx : T.Context, args : Args) {
    Debug.print("\nPlayer connected: " # debug_show (args.principal));
    let entity = ECS.Manager.addEntity(ctx, Principal.toText(args.principal));
    ECS.Manager.addComponent(
      ctx,
      entity,
      {
        title = "player";
        data = #Player({
          principal = args.principal;
          position = { x = 0; y = 0; z = 0 };
        });
      },
    );
  };

  public let Handler : T.ActionHandler<T.Context, Args> = {
    handle = handle;
  };
};
