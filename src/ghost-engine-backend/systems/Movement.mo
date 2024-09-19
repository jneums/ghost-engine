import ECS "../ecs";
import Container "../container";
import Time "mo:base/Time";
import Debug "mo:base/Debug";

module {
  func update(ctx : ECS.Types.Context, entityId : ECS.Types.EntityId, timeDelta : Time.Time) : () {
    let container = ECS.Manager.getContainer(ctx, entityId);

    switch (Container.Manager.getComponent(container, "position")) {
      case (?position) {
        // Debug.print("\nEntity: " # debug_show (entityId) # "\nPosition: " # debug_show (position) # "\nTime Delta: " # debug_show (timeDelta));
      };
      case (null) {
        // Debug.print("Entity: " # debug_show (entityId) # " Position: null");
      };
    };
  };

  public let MovementSystem : ECS.Types.System = {
    systemType = "movement";
    components = ["position", "velocity"];
    update = update;
  };
};
