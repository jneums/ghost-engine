import T "Types";
import Components "../components";
import Debug "mo:base/Debug";
import World "mo:geecs/World";
import Vector3 "../math/Vector3";

module {
  public type Args = {
    entityId : Nat;
    position : Vector3.Vector3;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nMove entity: " # debug_show (args.entityId) # " to " # debug_show (args.position));
    let position = #MoveTargetComponent({
      position = args.position;
    });
    World.addComponent(ctx, args.entityId, "MoveTargetComponent", position);
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
