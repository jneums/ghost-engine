import ECS "mo:geecs";
import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Option "mo:base/Option";
import Player "../utils/Player";
import Components "../components";

module {
  public type Args = {
    principal : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nPlayer connected: " # debug_show (args.principal));

    // Check if the player already has entityId
    let entityId = Player.findPlayersEntityId(ctx, args.principal);
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

    // Get old transform if exists
    let oldTransform = ECS.World.getComponent(ctx, entity, "TransformComponent");
    let newTransform = switch (oldTransform) {
      case (? #TransformComponent(transform)) {
        transform;
      };
      case (_) {
        {
          scale = { x = 1.0; y = 1.0; z = 1.0 };
          rotation = { x = 0.0; y = 0.0; z = 0.0; w = 0.0 };
          position = { x = 0.0; y = 0.0; z = 0.0 };
        };
      };
    };
    ECS.World.addComponent(
      ctx,
      entity,
      "TransformComponent",
      #TransformComponent(newTransform),
    );

    // Get old cargo if exists
    let oldCargo = ECS.World.getComponent(ctx, entity, "CargoComponent");
    let newCargo = switch (oldCargo) {
      case (? #CargoComponent(cargo)) {
        cargo;
      };
      case (_) {
        {
          capacity = 100;
          current = 0;
        };
      };
    };
    ECS.World.addComponent(
      ctx,
      entity,
      "CargoComponent",
      #CargoComponent(newCargo),
    );

    // Get old health if it exists
    let oldHealth = ECS.World.getComponent(ctx, entity, "HealthComponent");
    let newHealth = switch (oldHealth) {
      case (? #HealthComponent(health)) {
        health;
      };
      case (_) {
        {
          amount = 10;
          max = 10;
        };
      };
    };
    ECS.World.addComponent(
      ctx,
      entity,
      "HealthComponent",
      #HealthComponent(newHealth),
    );

  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
