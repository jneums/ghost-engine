import Vector3 "../math/Vector3";
import Time "mo:base/Time";
import Nat8 "mo:base/Nat8";
import Map "mo:stable-hash-map/Map/Map";
import Quaternion "../math/Quaternion";

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
    position : Vector3.Vector3;
  };

  public type RespawnComponent = {
    deathTime : Time.Time;
    duration : Time.Time;
  };

  public type VelocityComponent = {
    velocity : Vector3.Vector3;
  };

  public type TransformComponent = {
    position : Vector3.Vector3;
    rotation : Quaternion.Quaternion;
    scale : Vector3.Vector3;
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

  public type BlocksComponent = {
    chunkPositions : [Text]; // Array of chunk position keys
    blockData : [[Nat8]]; // Array of block data corresponding to each chunk position
  };

  public type ChunksComponent = {
    chunks : [Text]; // List of chunk positions
  };

  // Define a tag component for updating player chunks
  public type UpdateChunksComponent = {};

  public type PlayerViewComponent = {
    viewRadius : Float; // Radius around the player to load chunks
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
    #ChunksComponent : ChunksComponent;
    #PlayerViewComponent : PlayerViewComponent;
    #UpdateChunksComponent : UpdateChunksComponent;

    // Global block store for backend only
    #BlocksComponent : BlocksComponent;
  };
};
