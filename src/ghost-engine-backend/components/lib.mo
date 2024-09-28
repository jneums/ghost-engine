import Math "../math";
import Time "mo:base/Time";

module {
  public type PrincipalComponent = {
    principal : Principal;
  };

  public type NameableComponent = {
    name : Text;
  };

  public type HealthComponent = {
    amount : Nat;
    max : Nat;
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

  public type DamageComponent = {
    sourceEntityId : Nat;
    amount : Nat;
  };

  public type CombatComponent = {
    targetEntityId : Nat;
    speed : Float;
    range : Float;
    startAt : Time.Time;
  };

  public type CargoComponent = {
    capacity : Nat;
    current : Nat;
  };

  public type ResourceComponent = {
    resourceType : Text;
  };

  public type NodeSpawningComponent = {
    maxNodes : Nat;
    spawnInterval : Time.Time;
    lastSpawn : Time.Time;
    spawnBoundary : {
      minX : Float;
      maxX : Float;
      minZ : Float;
      maxZ : Float;
    };
  };
  // Define new component data types here...

  // Register component data types here...
  public type Component = {
    #PrincipalComponent : PrincipalComponent;
    #PositionComponent : PositionComponent;
    #VelocityComponent : VelocityComponent;
    #TransformComponent : TransformComponent;
    #ConnectionComponent : ConnectionComponent;
    #CargoComponent : CargoComponent;
    #NodeSpawningComponent : NodeSpawningComponent;
    #ResourceComponent : ResourceComponent;
    #NameableComponent : NameableComponent;
    #HealthComponent : HealthComponent;
    #CombatComponent : CombatComponent;
    #DamageComponent : DamageComponent;
  };
};
