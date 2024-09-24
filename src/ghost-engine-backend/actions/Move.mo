import T "Types";
import Math "../math";
import Components "../components";
import Debug "mo:base/Debug";
import World "mo:geecs/World";

module {
  public type Args = {
    entityId : Nat;
    position : Math.Types.Vector3;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nMove entity: " # debug_show (args.entityId) # " to " # debug_show (args.position));
    let position = #PositionComponent({
      position = args.position;
    });
    World.addComponent(ctx, args.entityId, "PositionComponent", position);
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
