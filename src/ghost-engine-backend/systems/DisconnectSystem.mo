import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";
import Const "../utils/Const";

module {

  // Private function to handle TransformComponent logic
  private func handleTransformComponent(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    let defaultTransform = Const.SpawnPoint;

    let transform = switch (ECS.World.getComponent(ctx, entityId, "TransformComponent")) {
      case (? #TransformComponent(transform)) { transform };
      case (_) {
        // Check for a snapshot of the player's transform
        switch (ECS.World.getComponent(ctx, entityId, "OfflineTransformComponent")) {
          case (? #OfflineTransformComponent(transform)) { transform };
          case (_) { defaultTransform };
        };
      };
    };
    ECS.World.addComponent(ctx, entityId, "OfflineTransformComponent", #OfflineTransformComponent(transform));
    ECS.World.removeComponent(ctx, entityId, "TransformComponent");
  };

  // Private function to handle disconnection logic
  private func handleDisconnection(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, disconnect : Components.DisconnectComponent) {
    let currentTime = Time.now();
    let elapsedTime = currentTime - disconnect.startAt;

    if (elapsedTime >= disconnect.duration) {
      // Save a snapshot of the player's transform
      handleTransformComponent(ctx, entityId);

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
