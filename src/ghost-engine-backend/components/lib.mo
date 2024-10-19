import Vector3 "../math/Vector3";
import Time "mo:base/Time";
import Nat8 "mo:base/Nat8";
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
    waypoints : [Vector3.Vector3];
  };

  public type RespawnComponent = {
    deathTime : Time.Time;
    duration : Time.Time;
  };

  public type VelocityComponent = {
    x : Float;
    y : Float;
    z : Float;
  };

  public type TransformComponent = {
    position : Vector3.Vector3;
    rotation : Quaternion.Quaternion;
    scale : Vector3.Vector3;
  };

  public type SessionComponent = {
    lastAction : Time.Time;
  };

  public type ConnectComponent = {
    principal : Principal;
  };

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

  public type MiningComponent = {
    position : Vector3.Vector3;
    speed : Float;
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
    seed : Nat64; // Seed for generating terrain
    chunkPositions : [Vector3.Vector3]; // Array of chunk positions
    blockData : [[Nat8]]; // Array of block data corresponding to each chunk position
    chunkStatus : [Nat8]; // Array of status corresponding to each chunk position
    changedBlocks : [[(Nat, Nat8)]] // List of block changes (index, value)
  };

  public type UpdateChunksComponent = {};

  public type BlockUpdate = (Vector3.Vector3, Nat8); // position, value

  public type UpdateBlocksComponent = {
    blocks : [BlockUpdate];
  };

  public type PlayersChunk = {
    chunkId : Vector3.Vector3;
    updatedAt : Time.Time;
  };

  public type PlayerChunksComponent = {
    chunks : [{ chunkId : Vector3.Vector3; updatedAt : Time.Time }]; // List of chunk positions
  };

  public type PlayerViewComponent = {
    viewRadius : Float; // Radius around the player to load chunks
  };

  // Register component data types here...
  public type Component = {
    #PrincipalComponent : PrincipalComponent;
    #MoveTargetComponent : MoveTargetComponent;
    #VelocityComponent : VelocityComponent;
    #TransformComponent : TransformComponent;
    #ConnectComponent : ConnectComponent;
    #DisconnectComponent : DisconnectComponent;
    #SessionComponent : SessionComponent;
    #FungibleComponent : FungibleComponent;
    #ResourceComponent : ResourceComponent;
    #NameableComponent : NameableComponent;
    #HealthComponent : HealthComponent;
    #CombatComponent : CombatComponent;
    #MiningComponent : MiningComponent;
    #DamageComponent : DamageComponent;
    #RespawnComponent : RespawnComponent;
    #RedeemTokensComponent : RedeemTokensComponent;
    #PlayerChunksComponent : PlayerChunksComponent;
    #PlayerViewComponent : PlayerViewComponent;
    #UpdatePlayerChunksComponent : UpdateChunksComponent;

    // Global block store for backend only
    #BlocksComponent : BlocksComponent;
    #UpdateBlocksComponent : UpdateBlocksComponent;
    #UpdateChunksComponent : UpdateChunksComponent;
  };
};
