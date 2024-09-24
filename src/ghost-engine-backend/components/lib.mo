import Math "../math";
import Time "mo:base/Time";

module {
  public type PrincipalComponent = {
    principal : Principal;
  };

  public type PositionComponent = {
    position : Math.Types.Vector3;
  };

  public type VelocityComponent = {
    velocity : Math.Types.Vector3;
  };

  public type TransformComponent = {
    position : Math.Types.Vector3;
    rotation : Math.Types.Quaternion;
    scale : Math.Types.Vector3;
  };

  public type ConnectionComponent = {
    offline_since : Time.Time;
  };
  // Define new component data types here...

  // Register component data types here...
  public type Component = {
    #PrincipalComponent : PrincipalComponent;
    #PositionComponent : PositionComponent;
    #VelocityComponent : VelocityComponent;
    #TransformComponent : TransformComponent;
    #ConnectionComponent : ConnectionComponent;
  };
};
