import T "./Types";
import S "./State";
import Map "mo:stable-hash-map/Map/Map";
import { API = ComponentAPI; Types = ComponentTypes } "../components";

module {
  public func addEntity(ctx : T.Context) : T.EntityId {
    let id = Map.size(ctx.entities);
    Map.set(ctx.entities, Map.nhash, id, ComponentAPI.new());
    id;
  };

  public func removeEntity(ctx : T.Context, entityId : T.EntityId) : () {
    Map.delete(ctx.entities, Map.nhash, entityId);
  };

  public func addComponent(ctx : T.Context, entityId : T.EntityId, component : ComponentTypes.Component) : () {
    let container = switch (Map.get(ctx.entities, Map.nhash, entityId)) {
      case (?exists) { exists };
      case (null) { ComponentAPI.new() };
    };

    ComponentAPI.add(container, component);
  };

  public func getContainer(ctx : T.Context, entityId : T.EntityId) : ComponentTypes.ComponentContainer {
    switch (Map.get(ctx.entities, Map.nhash, entityId)) {
      case (?exists) { exists };
      case (null) { ComponentAPI.new() };
    };
  };

  public func removeComponent(ctx : T.Context, entityId : T.EntityId, componentType : ComponentTypes.ComponentType) : () {
    let container = switch (Map.get(ctx.entities, Map.nhash, entityId)) {
      case (?exists) { exists };
      case (null) { ComponentAPI.new() };
    };

    ComponentAPI.delete(container, componentType);
  };

  public let API : T.API = {
    addEntity = addEntity;
    removeEntity = removeEntity;
    addComponent = addComponent;
    getContainer = getContainer;
    removeComponent = removeComponent;
  };

  public let Types = T;
  public let State = S;
};
