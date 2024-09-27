import T "Types";
import Components "../components";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import World "mo:geecs/World";

module {
  public type Args = {
    entityId : Nat;
    targetEntityId : Nat;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nBegin mining: " # debug_show (args.entityId) # " target " # debug_show (args.targetEntityId));
    let mining = #MiningComponent({
      targetEntityId = args.targetEntityId;
      startAt = Time.now();
      speed = 5.0;
      range = 3.0;
    });
    World.addComponent(ctx, args.entityId, "MiningComponent", mining);
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
