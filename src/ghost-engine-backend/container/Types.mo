import Map "mo:stable-hash-map/Map/Map";
import Components "../components";

module {
  /// Title must match the class name of the corresponding component
  /// on the frontend.
  public type ComponentType = Text;
  public type Component = {
    componentType : ComponentType;
    componentData : Components.Data;
  };

  public type Container = Map.Map<ComponentType, Component>;

  public type API = {
    new : () -> Container;
    addComponent : (Container, Component) -> ();
    getComponent : (Container, ComponentType) -> ?Component;
    hasComponent : (Container, ComponentType) -> Bool;
    hasAllComponents : (Container, [ComponentType]) -> Bool;
    deleteComponent : (Container, ComponentType) -> ();
  };
};
