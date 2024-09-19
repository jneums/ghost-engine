import T "Types";
import Map "mo:stable-hash-map/Map/Map";
import Array "mo:base/Array";
import Option "mo:base/Option";

module {
  func new() : T.Container {
    Map.new<T.ComponentType, T.Component>(Map.thash);
  };

  func add(container : T.Container, component : T.Component) : () {
    Map.set(container, Map.thash, component.componentType, component);
  };

  func get(container : T.Container, componentType : Text) : ?T.Component {
    Map.get(container, Map.thash, componentType);
  };

  func has(container : T.Container, componentType : T.ComponentType) : Bool {
    Map.has(container, Map.thash, componentType);
  };

  func hasAll(container : T.Container, componentTypes : [T.ComponentType]) : Bool {
    Map.every<T.ComponentType, T.Component>(
      container,
      func(k : T.ComponentType, v : T.Component) {
        let res = Array.find(
          componentTypes,
          func(c : T.ComponentType) : Bool {
            c == k;
          },
        );

        Option.isSome(res);
      },
    );
  };

  func delete(container : T.Container, componentType : T.ComponentType) : () {
    Map.delete(container, Map.thash, componentType);
  };

  public let Manager : T.API = {
    new = new;
    addComponent = add;
    getComponent = get;
    hasComponent = has;
    hasAllComponents = hasAll;
    deleteComponent = delete;
  };

  public let Types = T;
};
