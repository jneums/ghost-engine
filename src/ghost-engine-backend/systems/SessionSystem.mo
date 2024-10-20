import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Components "../components";
import Const "../utils/Const";

module {

  // Private function to check if the unit should be disconnected due to inactivity
  private func shouldDisconnect(session : Components.SessionComponent) : Bool {
    let currentTime = Time.now();
    let elapsedTime = currentTime - session.lastAction;
    elapsedTime >= Const.MAX_AFK_BEFORE_DISCONNECT;
  };

  // Private function to handle unit disconnection
  private func handleDisconnection(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    switch (ECS.World.getComponent(ctx, entityId, "DisconnectComponent")) {
      case (? #DisconnectComponent(_)) {};
      case (_) {
        Debug.print("\nUnit disconnected due to inactivity");
        let disconnect = #DisconnectComponent({
          startAt = Time.now();
          duration = Const.DISCONNECT_DURATION;
        });
        ECS.World.addComponent(ctx, entityId, "DisconnectComponent", disconnect);
      };
    };
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _ : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "SessionComponent")) {
      case (? #SessionComponent(session)) {
        if (shouldDisconnect(session)) {
          handleDisconnection(ctx, entityId);
        };
      };
      case (_) {};
    };
  };

  public let SessionSystem : ECS.Types.System<Components.Component> = {
    systemType = "SessionSystem";
    archetype = ["SessionComponent"];
    update = update;
  };
};
