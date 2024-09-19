import ECS "../ecs";
import T "Types";
import Shared "../shared";

module {
  public type Context = ECS.Types.Context;

  public type Args = {
    entity : Text;
    position : Shared.Types.Vector3;
  };

  func handle(ctx : Context, args : Args) {
    let entity = args.entity;
    let position = args.position;
  };

  public let Handler : T.ActionHandler<Context, Args> = {
    handle = handle;
  };
};
