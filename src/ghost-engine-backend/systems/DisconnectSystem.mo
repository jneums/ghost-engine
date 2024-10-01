import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";

module {
  // Max offline time is 5 seconds in nanoseconds
  let MAX_OFFLINE_TIME = 5_000_000_000;

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _ : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "ConnectionComponent")) {
      case (? #ConnectionComponent(connection)) {
        // Don't do anything if the player is still online
        if (connection.offlineSince == 0) {
          return;
        };

        let currentTime = Time.now();
        let elapsedTime = currentTime - connection.offlineSince;

        if (elapsedTime >= MAX_OFFLINE_TIME) {

          // Save a snapshot of the player's transform
          let transform = ECS.World.getComponent(ctx, entityId, "TransformComponent");
          let offlineTransform = switch (transform) {
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
            entityId,
            "OfflineTransformComponent",
            #OfflineTransformComponent(offlineTransform),
          );

          // Remove the players transform
          ECS.World.removeComponent(ctx, entityId, "TransformComponent");

          // Remove the player from the simulation
          ECS.World.removeComponent(ctx, entityId, "ConnectionComponent");
        };
      };
      case (_) {};
    };
  };

  public let DisconnectSystem : ECS.Types.System<Components.Component> = {
    systemType = "DisconnectSystem";
    archetype = ["ConnectionComponent"];
    update = update;
  };
};
