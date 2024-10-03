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

  public type SessionComponent = {
    lastAction : Time.Time;
  };

  public type ConnectComponent = {};

  public type DisconnectComponent = {
    startAt : Time.Time;
    duration : Time.Time;
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
    #ConnectComponent : ConnectComponent;
    #DisconnectComponent : DisconnectComponent;
    #SessionComponent : SessionComponent;
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
