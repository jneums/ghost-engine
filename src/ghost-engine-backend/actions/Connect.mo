import ECS "mo:geecs";
import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Player "../utils/Player";
import Components "../components";

module {
  public type Args = {
    principal : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nPlayer connected: " # debug_show (args.principal));

    /// Check if the player already has entityId
    let entityId = Player.findPlayersEntityId(ctx, args.principal);
    let entity = switch (entityId) {
      case (?exists) {
        exists;
      };
      case (null) {
        // Create new entity and add principal component
        let newId = ECS.World.addEntity(ctx);
        ECS.World.addComponent(
          ctx,
          newId,
          "PrincipalComponent",
          #PrincipalComponent({
            principal = args.principal;
          }),
        );
        newId;
      };
    };

    ECS.World.addComponent(
      ctx,
      entity,
      "PositionComponent",
      #PositionComponent({
        position = { x = 0; y = 0; z = 0 };
      }),
    );
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
