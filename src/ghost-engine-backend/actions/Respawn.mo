import ECS "mo:geecs";
import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Option "mo:base/Option";
import Time "mo:base/Time";
import Units "../utils/Units";
import Components "../components";

module {
  public type Args = {
    principal : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nUnit respawned: " # debug_show (args.principal));

    // Check if the unit already has entityId
    let entityId = Units.getEntityId(ctx, args.principal);
    let entity = Option.get(entityId, ECS.World.addEntity(ctx));

    // Add the principal and connection components
    ECS.World.addComponent(
      ctx,
      entity,
      "RespawnComponent",
      #RespawnComponent({
        deathTime = Time.now();
        duration = 30 * 1_000_000_000;
      }),
    );
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
