import ECS "mo:geecs";
import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Units "../utils/Units";
import Components "../components";

module {
  public type Args = {
    principal : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nUnit connected: " # debug_show (args.principal));

    // Check if the unit already has entityId
    let entityId = switch (Units.getEntityId(ctx, args.principal)) {
      case (?exists) {
        exists;
      };
      case (null) {
        ECS.World.addEntity(ctx);
      };
    };

    // Add the connection component
    ECS.World.addComponent(
      ctx,
      entityId,
      "ConnectComponent",
      #ConnectComponent({ principal = args.principal }),
    );
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
