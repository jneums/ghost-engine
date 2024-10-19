import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";

module {
  // Private function to handle disconnection logic
  private func handleDisconnection(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, disconnect : Components.DisconnectComponent) {
    let currentTime = Time.now();
    let elapsedTime = currentTime - disconnect.startAt;

    if (elapsedTime >= disconnect.duration) {
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
