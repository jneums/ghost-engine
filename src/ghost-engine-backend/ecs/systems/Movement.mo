import T "./Types";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Map "mo:stable-hash-map/Map/Map";
import ECSTypes "../manager/Types";
import { API = ComponentAPI; Types = ComponentTypes } "../components";

module {

  func update(ctx : ECSTypes.Context, ecs : ECSTypes.API, entityIds : [T.EntityId], time : Time.Time) : () {
    func updateEntity(entityId : T.EntityId, container : ComponentTypes.ComponentContainer) : () {
      let position = ComponentAPI.get(container, "position");
      let velocity = ComponentAPI.get(container, "velocity");
    };

    for ((entityId, container) in Map.entries(ctx.entities)) {
      updateEntity(entityId, container);
    };
  };

  public let MovementSystem : T.System = {
    systemType = "movement";
    components = ["position", "velocity"];
    update = update;
  };
};
