module {
  public type ActionHandler<C, T> = {
    handle : (C, T) -> ();
  };
};
