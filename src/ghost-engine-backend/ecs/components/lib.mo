import T "Types";
import Map "mo:stable-hash-map/Map/Map";
import Array "mo:base/Array";
import Option "mo:base/Option";

module {
  public func new() : T.ComponentContainer {
    Map.new<Text, T.Component>(Map.thash);
  };

  public func add(container : T.ComponentContainer, component : T.Component) : () {
    Map.set(container, Map.thash, component.componentType, component);
  };

  public func get(container : T.ComponentContainer, componentType : Text) : ?T.Component {
    Map.get(container, Map.thash, componentType);
  };

  public func has(container : T.ComponentContainer, componentType : T.ComponentType) : Bool {
    Map.has(container, Map.thash, componentType);
  };

  public func hasAll(container : T.ComponentContainer, componentTypes : [T.ComponentType]) : Bool {
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

  public func delete(container : T.ComponentContainer, componentType : T.ComponentType) : () {
    Map.delete(container, Map.thash, componentType);
  };

  public let API : T.API = {
    new = new;
    add = add;
    get = get;
    has = has;
    hasAll = hasAll;
    delete = delete;
  };

  public let Types = T;
};
