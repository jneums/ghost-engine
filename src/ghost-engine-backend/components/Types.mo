import Shared "../shared";

module {
  public type Position = Shared.Types.Vector3;
  public type Velocity = Shared.Types.Vector3;

  public type Data = {
    #Position : Position;
    #Velocity : Velocity;
  };
};
