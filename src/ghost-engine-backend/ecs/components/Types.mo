import Map "mo:stable-hash-map/Map/Map";

module {
  public type ComponentId = Nat;
  public type ComponentType = Text;

  public type ComponentContainer = Map.Map<ComponentType, Component>;

  public type Component = {
    id : ComponentId;
    componentType : ComponentType;
    component : ComponentData;
  };

  public type Position = {
    x : Nat;
    y : Nat;
  };

  public type Velocity = {
    dx : Nat;
    dy : Nat;
  };

  public type ComponentData = {
    #Position : Position;
    #Velocity : Velocity;
  };

  public type API = {
    new : () -> ComponentContainer;
    add : (ComponentContainer, Component) -> ();
    get : (ComponentContainer, ComponentType) -> ?Component;
    has : (ComponentContainer, ComponentType) -> Bool;
    hasAll : (ComponentContainer, [ComponentType]) -> Bool;
    delete : (ComponentContainer, ComponentType) -> ();
  };
};
