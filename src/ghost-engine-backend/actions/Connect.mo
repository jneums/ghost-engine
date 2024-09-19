import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

module {
  public type Args = {
    principal : Principal;
  };

  func handle(ctx : T.Context, args : Args) {
    Debug.print("\nPlayer connected: " # debug_show (args.principal));
  };

  public let Handler : T.ActionHandler<T.Context, Args> = {
    handle = handle;
  };
};
