import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";

module {

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _ : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "ConnectionComponent")) {
      case (? #ConnectionComponent(connection)) {
        // Don't do anything if the player is disconnecting
        if (connection.offlineSince != 0) {
          return;
        };

        // Get old transform if exists, otherwise get the offline transform.
        // If no transform exists, create a new one.
        switch (ECS.World.getComponent(ctx, entityId, "TransformComponent")) {
          case (? #TransformComponent(transform)) {
            ECS.World.addComponent(
              ctx,
              entityId,
              "TransformComponent",
              #TransformComponent(transform),
            );
          };
          case (_) {
            // Otherwise, check for a snapshot of the player's transform
            let offlineTransform = ECS.World.getComponent(ctx, entityId, "OfflineTransformComponent");
            let newTransform = switch (offlineTransform) {
              case (? #OfflineTransformComponent(transform)) {
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
              entityId,
              "TransformComponent",
              #TransformComponent(newTransform),
            );
          };
        };

        // Get old wallet if exists
        let oldFungible = ECS.World.getComponent(ctx, entityId, "FungibleComponent");
        let newFungible = switch (oldFungible) {
          case (? #FungibleComponent(fungible)) {
            fungible;
          };
          case (_) {
            {
              tokens = [];
            };
          };
        };
        ECS.World.addComponent(
          ctx,
          entityId,
          "FungibleComponent",
          #FungibleComponent(newFungible),
        );

        // Get old health if it exists
        let oldHealth = ECS.World.getComponent(ctx, entityId, "HealthComponent");
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
          entityId,
          "HealthComponent",
          #HealthComponent(newHealth),
        );

        ECS.World.removeComponent(ctx, entityId, "ConnectionComponent");

      };
      case (_) {};
    };
  };

  public let ConnectSystem : ECS.Types.System<Components.Component> = {
    systemType = "ConnectSystem";
    archetype = ["ConnectionComponent"];
    update = update;
  };
};
