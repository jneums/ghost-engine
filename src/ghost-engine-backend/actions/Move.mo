import T "Types";
import Math "../math";
import Components "../components";

module {
  public type Args = {
    entity : Text;
    position : Math.Types.Vector3;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    let entity = args.entity;
    let position = args.position;
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
