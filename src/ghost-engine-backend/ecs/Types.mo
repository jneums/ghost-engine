import Map "mo:stable-hash-map";
import Vector "mo:vector";
import Time "mo:base/Time";
import Container "../container";

module {
  public type Context = {
    containers : Containers;
    systemEntities : SystemEntities;
    systems : SystemRegistry;
    updated : Updated;
    nextEntityId : () -> EntityId;
  };

  public type EntityId = Text;
  public type Containers = Map.Map<EntityId, Container.Types.Container>;
  public type SystemEntities = Map.Map<SystemType, [EntityId]>;
  public type SystemRegistry = Map.Map<SystemType, System>;
  public type Updated = Vector.Vector<Update>;
  public type ComponentType = Text;

  public type Update = {
    #Insert : {
      entityId : EntityId;
      component : Container.Types.Component;
    };
    #Delete : {
      entityId : EntityId;
      componentType : ComponentType;
    };
  };

  public type SystemType = Text;
  public type System = {
    systemType : SystemType;
    components : [ComponentType];
    update : (Context, EntityId, Time.Time) -> ();
  };

  public type API = {
    // Entity API
    addEntity : (Context, EntityId) -> EntityId;
    removeEntity : (Context, EntityId) -> ();
    getContainer : (Context, EntityId) -> Container.Types.Container;
    // Component API
    addComponent : (Context, EntityId, Container.Types.Component) -> ();
    updateComponent : (Context, EntityId, Container.Types.Component) -> ();
    removeComponent : (Context, EntityId, Container.Types.ComponentType) -> ();
    // System API
    addSystem : (Context, System) -> ();
    update : (Context, Time.Time) -> Time.Time;
  };

};
