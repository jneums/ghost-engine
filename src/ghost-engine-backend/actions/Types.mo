import ECS "mo:geecs";

module {
  public type Context<T> = ECS.Types.Context<T>;

  public type ActionHandler<C, T> = {
    handle : (C, T) -> ();
  };
};
