import T "Types";
import Components "../components";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Array "mo:base/Array";
import World "mo:geecs/World";
import Vector3 "../math/Vector3";

module {
  public type Args = {
    entityId : Nat;
    position : Vector3.Vector3;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nBegin mining: " # debug_show (args.entityId) # " block " # debug_show (args.position));
    // Append the position to the mining component
    switch (World.getComponent(ctx, args.entityId, "MiningComponent")) {
      case (? #MiningComponent(mining)) {
        let updated = #MiningComponent({
          positions = Array.append(mining.positions, [args.position]);
          startAt = mining.startAt;
          progress = mining.progress;
        });
        World.addComponent(ctx, args.entityId, "MiningComponent", updated);
      };
      case (_) {
        let mining = #MiningComponent({
          positions = [args.position];
          startAt = Time.now();
          progress = 0.0;
        });
        World.addComponent(ctx, args.entityId, "MiningComponent", mining);
      };
    };
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
