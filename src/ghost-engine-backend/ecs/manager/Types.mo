import Map "mo:stable-hash-map";
import ComponentTypes "../components/Types";

module {
  type SystemId = Text;
  public type Context = {
    entities : Entities;
    systems : Systems;
  };

  public type EntityId = Nat;
  public type Entities = Map.Map<EntityId, ComponentTypes.ComponentContainer>;
  public type Systems = Map.Map<SystemId, [EntityId]>;

  public type API = {
    // Entity API
    addEntity : (Context) -> EntityId;
    removeEntity : (Context, EntityId) -> ();
    // Component API
    addComponent : (Context, EntityId, ComponentTypes.Component) -> ();
    getContainer : (Context, EntityId) -> ComponentTypes.ComponentContainer;
    removeComponent : (Context, EntityId, ComponentTypes.ComponentType) -> ();
  };

};
