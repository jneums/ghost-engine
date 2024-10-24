import T "Types";
import Components "../components";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import World "mo:geecs/World";
import Vector3 "../math/Vector3";

module {
  public type Args = {
    entityId : Nat;
    position : Vector3.Vector3;
    tokenCid : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nBegin placing: " # debug_show (args.entityId) # " block " # debug_show (args.position));
    let placeBlock = #PlaceBlockComponent({
      position = args.position;
      startAt = Time.now();
      speed = 0.0;
      tokenCid = args.tokenCid;
    });
    World.addComponent(ctx, args.entityId, "PlaceBlockComponent", placeBlock);
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
