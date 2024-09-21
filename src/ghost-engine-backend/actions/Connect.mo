import ECS "mo:geecs";
import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Option "mo:base/Option";
import PlayerQueries "../queries/PlayerQueries";
import Components "../components";

module {
  public type Args = {
    principal : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nPlayer connected: " # debug_show (args.principal));

    // Check if the player already has entityId
    let entityId = PlayerQueries.findPlayersEntityId(ctx, args.principal);
    let entity = Option.get(entityId, ECS.World.addEntity(ctx));

    ECS.World.addComponent(
      ctx,
      entity,
      "PrincipalComponent",
      #PrincipalComponent({
        principal = args.principal;
      }),
    );

    ECS.World.addComponent(
      ctx,
      entity,
      "TransformComponent",
      #TransformComponent({
        scale = { x = 1; y = 1; z = 1 };
        rotation = { x = 0; y = 0; z = 0; w = 0 };
        position = { x = 0; y = 0; z = 0 };
      }),
    );
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
