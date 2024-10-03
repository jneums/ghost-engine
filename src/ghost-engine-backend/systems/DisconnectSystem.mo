import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";

module {

  // Private function to get the current transform or a default one
  private func getOfflineTransform(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) : Components.TransformComponent {
    let transform = ECS.World.getComponent(ctx, entityId, "TransformComponent");
    switch (transform) {
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
  };

  // Private function to handle disconnection logic
  private func handleDisconnection(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, disconnect : Components.DisconnectComponent) {
    let currentTime = Time.now();
    let elapsedTime = currentTime - disconnect.startAt;

    if (elapsedTime >= disconnect.duration) {
      // Save a snapshot of the player's transform
      let offlineTransform = getOfflineTransform(ctx, entityId);
      ECS.World.addComponent(ctx, entityId, "OfflineTransformComponent", #OfflineTransformComponent(offlineTransform));

      // Remove the player's transform
      ECS.World.removeComponent(ctx, entityId, "TransformComponent");

      // Remove the player from the simulation
      ECS.World.removeComponent(ctx, entityId, "SessionComponent");
      ECS.World.removeComponent(ctx, entityId, "DisconnectComponent");
    };
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _ : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "DisconnectComponent")) {
      case (? #DisconnectComponent(disconnect)) {
        handleDisconnection(ctx, entityId, disconnect);
      };
      case (_) {};
    };
  };

  public let DisconnectSystem : ECS.Types.System<Components.Component> = {
    systemType = "DisconnectSystem";
    archetype = ["DisconnectComponent"];
    update = update;
  };
};
