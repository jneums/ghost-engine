import T "Types";
import S "State";
import Map "mo:stable-hash-map/Map/Map";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import TrieSet "mo:base/TrieSet";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Container "../container";

module {
  func addEntity(ctx : T.Context) : T.EntityId {
    let id = ctx.nextEntityId();
    Map.set(ctx.containers, Map.nhash, id, Container.Manager.new());
    id;
  };

  func removeEntity(ctx : T.Context, entityId : T.EntityId) : () {
    Map.delete(ctx.containers, Map.nhash, entityId);
  };

  func addComponent(ctx : T.Context, entityId : T.EntityId, component : Container.Types.Component) : () {
    let container = getContainer(ctx, entityId);

    Container.Manager.addComponent(container, component);
    addEntityToAllSystems(ctx, entityId);
  };

  func getContainer(ctx : T.Context, entityId : T.EntityId) : Container.Types.Container {
    Option.get(Map.get(ctx.containers, Map.nhash, entityId), Container.Manager.new());
  };

  func removeComponent(ctx : T.Context, entityId : T.EntityId, componentType : Container.Types.ComponentType) : () {
    let container = getContainer(ctx, entityId);

    Container.Manager.deleteComponent(container, componentType);
    addEntityToAllSystems(ctx, entityId);
  };

  func addEntityToAllSystems(ctx : T.Context, entityId : T.EntityId) : () {
    for ((systemType, sys) in Map.entries(ctx.systems)) {
      addEntityToSystem(ctx, entityId, sys);
    };
  };

  func hasAllRequirements(container : Container.Types.Container, required : [Container.Types.ComponentType]) : Bool {
    for (componentType in Iter.fromArray(required)) {
      switch (Container.Manager.getComponent(container, componentType)) {
        case (?_) { () };
        case (null) { return false };
      };
    };

    return true;
  };

  func addEntityToSystem(ctx : T.Context, entityId : T.EntityId, sys : T.System) : () {
    let container = getContainer(ctx, entityId);
    let required = sys.components;

    switch (hasAllRequirements(container, required)) {
      case (true) {
        // If the system is not already in the systems containers array, add it
        let entities = Map.get(ctx.systemEntities, Map.thash, sys.systemType);
        switch (entities) {
          case (?exists) {
            let set = TrieSet.fromArray(exists, Hash.hash, Nat.equal);
            let updatedSet = TrieSet.put<Nat>(set, entityId, Hash.hash(entityId), Nat.equal);
            Map.set(ctx.systemEntities, Map.thash, sys.systemType, TrieSet.toArray(updatedSet));
          };
          case (null) {
            Map.set(ctx.systemEntities, Map.thash, sys.systemType, [entityId]);
          };
        };
      };
      case (false) {
        Map.delete(ctx.systemEntities, Map.thash, sys.systemType);
      };
    };

  };

  func addSystem(ctx : T.Context, sys : T.System) : () {
    Map.set(ctx.systemEntities, Map.thash, sys.systemType, []);
    Map.set(ctx.systems, Map.thash, sys.systemType, sys);

    for (entityId in Map.keys(ctx.containers)) {
      addEntityToSystem(ctx, entityId, sys);
    };
  };

  func update(ctx : T.Context, lastTick : Time.Time) : Time.Time {
    let now = Time.now();
    let deltaTime = now - lastTick;

    for ((systemId, entities) in Map.entries(ctx.systemEntities)) {
      switch (Map.get(ctx.systems, Map.thash, systemId)) {
        case (?exists) {
          for (entityId in Iter.fromArray(entities)) {
            exists.update(ctx, entityId, deltaTime);
          };
        };
        case (null) { Debug.print("System does not exist!") };
      };
    };

    Debug.print("\nGame loop tick with time delta: " # debug_show (deltaTime));
    now;
  };

  public let Manager : T.API = {
    addEntity = addEntity;
    removeEntity = removeEntity;
    addComponent = addComponent;
    getContainer = getContainer;
    removeComponent = removeComponent;
    update = update;
    addSystem = addSystem;
  };

  public let Types = T;
  public let State = S;
};
