import T "./Types";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import ECSTypes "../manager/Types";
import { API = ComponentAPI } "../components";

module {

  func update(ctx : ECSTypes.Context, ecs : ECSTypes.API, entityIds : [T.EntityId], timeDelta : Time.Time) : () {
    func updateEntity(entityId : T.EntityId) : () {
      let container = ecs.getContainer(ctx, entityId);

      switch (ComponentAPI.get(container, "position")) {
        case (?position) {
          Debug.print("Entity: " # debug_show (entityId) # " Position: " # debug_show (position));
        };
        case (null) {
          Debug.print("Entity: " # debug_show (entityId) # " Position: null");
        };
      };
    };

    for (entityId in Iter.fromArray(entityIds)) {
      updateEntity(entityId);
    };
  };

  public let LoggingSystem : T.System = {
    systemType = "logging";
    components = ["position"];
    update = update;
  };
};
