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
    Debug.print("\nPlayer respawned: " # debug_show (args.principal));

    // Check if the player already has entityId
    let entityId = PlayerQueries.findPlayersEntityId(ctx, args.principal);
    let entity = Option.get(entityId, ECS.World.addEntity(ctx));

    // Add the principal and connection components
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
      "ConnectionComponent",
      #ConnectionComponent({
        offline_since = 0;
      }),
    );

    ECS.World.addComponent(
      ctx,
      entity,
      "TransformComponent",
      #TransformComponent({
        scale = { x = 1.0; y = 1.0; z = 1.0 };
        rotation = { x = 0.0; y = 0.0; z = 0.0; w = 0.0 };
        position = { x = 0.0; y = 0.0; z = 0.0 };
      }),
    );

    ECS.World.addComponent(
      ctx,
      entity,
      "CargoComponent",
      #CargoComponent({
        capacity = 100;
        current = 0;
      }),
    );

    ECS.World.addComponent(
      ctx,
      entity,
      "HealthComponent",
      #HealthComponent({
        amount = 10;
        max = 10;
      }),
    );

  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
