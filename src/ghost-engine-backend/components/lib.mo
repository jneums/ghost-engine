import Shared "../shared";

module {
  /// Define new component data types here
  public type Position = Shared.Types.Vector3;
  public type Velocity = Shared.Types.Vector3;

  /// Register component data types here
  public type Data = {
    #Position : Shared.Types.Vector3;
    #Velocity : Shared.Types.Vector3;
  };
};
