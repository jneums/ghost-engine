import ECS "mo:geecs";

import Components "../components";

module {
  public let componentToText = func(a : Components.Component) : Text {
    debug_show (a);
  };
  public let componentEqual = func(a : Components.Component, b : Components.Component) : Bool {
    debug_show (a) == debug_show (b);
  };

  public let createContext = func(nextEntityId : () -> Nat) : ECS.Types.Context<Components.Component> {
    {
      entities = ECS.State.Entities.new<Components.Component>();
      registeredSystems = ECS.State.SystemRegistry.new<Components.Component>();
      systemsEntities = ECS.State.SystemsEntities.new();
      updatedComponents = ECS.State.UpdatedComponents.new<Components.Component>();

      // Incrementing entity counter for ids.
      nextEntityId;
    };
  };
};
