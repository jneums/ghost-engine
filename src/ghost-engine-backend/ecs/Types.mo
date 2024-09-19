import Map "mo:stable-hash-map";
import Time "mo:base/Time";
import Container "../container";

module {
  public type Context = {
    containers : Containers;
    systemEntities : SystemEntities;
    systems : SystemRegistry;
    nextEntityId : () -> EntityId;
  };

  public type EntityId = Nat;
  public type Containers = Map.Map<EntityId, Container.Types.Container>;
  public type SystemEntities = Map.Map<SystemType, [EntityId]>;
  public type SystemRegistry = Map.Map<SystemType, System>;
  public type ComponentType = Text;

  public type SystemType = Text;
  public type System = {
    systemType : SystemType;
    components : [ComponentType];
    update : (Context, EntityId, Time.Time) -> ();
  };

  public type API = {
    // Entity API
    addEntity : (Context) -> EntityId;
    removeEntity : (Context, EntityId) -> ();
    // Component API
    addComponent : (Context, EntityId, Container.Types.Component) -> ();
    getContainer : (Context, EntityId) -> Container.Types.Container;
    removeComponent : (Context, EntityId, Container.Types.ComponentType) -> ();
    // System API
    addSystem : (Context, System) -> ();
    update : (Context, Time.Time) -> Time.Time;
  };

};
