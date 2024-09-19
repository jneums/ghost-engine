import Map "mo:stable-hash-map/Map/Map";
import Components "../components";

module {

  public type ComponentType = Text;
  public type Component = {
    title : Text;
    data : Components.Types.Data;
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
