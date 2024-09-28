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
    Debug.print("\nBegin attacking: " # debug_show (args.entityId) # " target " # debug_show (args.targetEntityId));
    let mining = #CombatComponent({
      targetEntityId = args.targetEntityId;
      startAt = Time.now();
      speed = 1.0;
      range = 7.0;
    });
    World.addComponent(ctx, args.entityId, "CombatComponent", mining);
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
