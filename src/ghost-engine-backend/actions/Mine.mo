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

    // Append the position to the mining component or remove if it already exists
    switch (World.getComponent(ctx, args.entityId, "MiningComponent")) {
      case (? #MiningComponent(mining)) {
        let existingIndex = Array.indexOf(
          args.position,
          mining.positions,
          Vector3.equal,
        );

        let updatedPositions = switch (existingIndex) {
          case (?index) {
            // Remove the position if it already exists
            let start = Array.take(mining.positions, index);
            let endIdx = if (Array.size(mining.positions) > index + 1) {
              Array.size(mining.positions) - 1 - index : Nat;
            } else {
              0;
            };

            let end = Array.take(mining.positions, -endIdx);
            Array.append(start, end);
          };
          case (_) {
            // Append the position if it does not exist
            Array.append(mining.positions, [args.position]);
          };
        };

        let updated = #MiningComponent({
          positions = updatedPositions;
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
