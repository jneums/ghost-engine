import ECS "../ecs";

module {
  public type Context = ECS.Types.Context;

  public type ActionHandler<C, T> = {
    handle : (C, T) -> ();
  };
};
