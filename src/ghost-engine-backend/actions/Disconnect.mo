import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import ECS "mo:geecs";
import Units "../utils/Units";
import Const "../utils/Const";
import Components "../components";

module {
  public type Args = {
    principal : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nUnit disconnected: " # debug_show (args.principal));

    let entityId = Units.getEntityId(ctx, args.principal);
    // Remove the unit from the simulation
    switch (entityId) {
      case (?exists) {
        // Update the unit's connection status
        ECS.World.addComponent(
          ctx,
          exists,
          "DisconnectComponent",
          #DisconnectComponent({
            startAt = Time.now();
            duration = Const.DISCONNECT_DURATION;
          }),
        );
      };
      case (null) {};
    };
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
