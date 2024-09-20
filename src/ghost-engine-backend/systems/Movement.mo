import ECS "mo:geecs";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Components "../components";

module {
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, deltaTime : Time.Time) : () {

    switch (ECS.World.getComponent(ctx, entityId, "Position")) {
      case (?position) {
        // Debug.print("\nEntity: " # debug_show (entityId) # "\nPosition: " # debug_show (position) # "\nTime Delta: " # debug_show (deltaTime));
      };
      case (null) {
        // Debug.print("Entity: " # debug_show (entityId) # " Position: null");
      };
    };
  };

  public let MovementSystem : ECS.Types.System<Components.Component> = {
    systemType = "MovementSystem";
    archetype = ["PositionComponent", "VelocityComponent"];
    update = update;
  };
};
