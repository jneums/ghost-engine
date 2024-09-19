import T "Types";
import Shared "../shared";

module {
  public type Args = {
    entity : Text;
    position : Shared.Types.Vector3;
  };

  func handle(ctx : T.Context, args : Args) {
    let entity = args.entity;
    let position = args.position;
  };

  public let Handler : T.ActionHandler<T.Context, Args> = {
    handle = handle;
  };
};
