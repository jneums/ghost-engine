import T "Types";
import Components "../components";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Array "mo:base/Array";
import ECS "mo:geecs";
import Vector3 "../math/Vector3";

module {
  public type Args = {
    entityId : Nat;
    position : Vector3.Vector3;
    tokenCid : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nQueue placing: " # debug_show (args.entityId) # " block " # debug_show (args.position));

    // Check if the entity already has a PlaceBlockComponent
    switch (ECS.World.getComponent(ctx, args.entityId, "PlaceBlockComponent")) {
      case (? #PlaceBlockComponent(placeBlock)) {
        let existingIndex = Array.indexOf(
          args.position,
          placeBlock.positions,
          Vector3.equal,
        );

        let updatedPositions = switch (existingIndex) {
          case (?index) {
            // Remove the position if it already exists
            let start = Array.take(placeBlock.positions, index);
            let endIdx = if (Array.size(placeBlock.positions) > index + 1) {
              Array.size(placeBlock.positions) - 1 - index : Nat;
            } else {
              0;
            };

            let end = Array.take(placeBlock.positions, -endIdx);
            Array.append(start, end);
          };
          case (_) {
            // Append the position if it does not exist
            Array.append(placeBlock.positions, [args.position]);
          };
        };

        let updatedTokenCids = switch (existingIndex) {
          case (?index) {
            // Remove the tokenCid if the position already exists
            let start = Array.take(placeBlock.tokenCids, index);
            let endIdx = if (Array.size(placeBlock.tokenCids) > index + 1) {
              Array.size(placeBlock.tokenCids) - 1 - index : Nat;
            } else {
              0;
            };

            let end = Array.take(placeBlock.tokenCids, -endIdx);
            Array.append(start, end);
          };
          case (_) {
            // Append the tokenCid if the position does not exist
            Array.append(placeBlock.tokenCids, [args.tokenCid]);
          };
        };

        let updated = #PlaceBlockComponent({
          positions = updatedPositions;
          startAt = placeBlock.startAt;
          progress = placeBlock.progress;
          tokenCids = updatedTokenCids;
        });
        ECS.World.addComponent(ctx, args.entityId, "PlaceBlockComponent", updated);
      };
      case (_) {
        // Create a new PlaceBlockComponent with the initial position
        let placeBlock = #PlaceBlockComponent({
          positions = [args.position];
          startAt = Time.now();
          progress = 0.0;
          tokenCids = [args.tokenCid];
        });
        ECS.World.addComponent(ctx, args.entityId, "PlaceBlockComponent", placeBlock);
      };
    };
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
