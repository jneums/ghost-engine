import Math "../math";
import Time "mo:base/Time";

module {
  // Define new component data types here...
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

  public type MoveTargetComponent = {
    position : Math.Types.Vector3;
  };

  public type RespawnComponent = {
    deathTime : Time.Time;
    duration : Time.Time;
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
    offlineSince : Time.Time;
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

  public type FungibleComponent = {
    tokens : [{
      symbol : Text;
      cid : Principal;
      amount : Nat;
    }];
  };

  public type ResourceComponent = {
    resourceType : Text;
  };

  public type RedeemTokensComponent = {
    startAt : Time.Time;
    duration : Time.Time;
    to : Principal;
  };

  // Register component data types here...
  public type Component = {
    #PrincipalComponent : PrincipalComponent;
    #MoveTargetComponent : MoveTargetComponent;
    #VelocityComponent : VelocityComponent;
    #TransformComponent : TransformComponent;
    #OfflineTransformComponent : TransformComponent;
    #ConnectionComponent : ConnectionComponent;
    #FungibleComponent : FungibleComponent;
    #ResourceComponent : ResourceComponent;
    #NameableComponent : NameableComponent;
    #HealthComponent : HealthComponent;
    #CombatComponent : CombatComponent;
    #DamageComponent : DamageComponent;
    #RespawnComponent : RespawnComponent;
    #RedeemTokensComponent : RedeemTokensComponent;
  };
};
