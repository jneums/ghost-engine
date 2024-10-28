import Vector3 "../math/Vector3";
import Time "mo:base/Time";
import Nat16 "mo:base/Nat16";
import Quaternion "../math/Quaternion";
import Tokens "../utils/Tokens";
import TokenRegistry "../utils/TokenRegistry";

module {
  public type BlockType = Nat16;

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

  public type PlaceBlockComponent = {
    position : Vector3.Vector3;
    tokenCid : Principal;
    startAt : Time.Time;
    speed : Float;
  };

  public type FungibleComponent = {
    tokens : [Tokens.Token];
  };

  public type ResourceComponent = {
    resourceType : Text;
  };

  public type ImportFungibleComponent = {
    to : Principal;
    tokenCid : Principal;
  };

  public type StakeFungibleComponent = {
    startAt : Time.Time;
    duration : Time.Time;
    from : Principal;
    tokenCid : Principal;
    amount : Nat;
  };

  public type UnstakeFungibleComponent = {
    startAt : Time.Time;
    duration : Time.Time;
    to : Principal;
    tokenCid : Principal;
    amount : Nat;
  };

  public type TokenRegistry = [(Nat16, Tokens.Token)];

  public type BlocksComponent = {
    seed : Nat64; // Seed for generating terrain
    chunkPositions : [Vector3.Vector3]; // Array of chunk positions
    blockData : [[BlockType]]; // Array of block data corresponding to each chunk position
    chunkStatus : [Nat8]; // Array of status corresponding to each chunk position
    changedBlocks : [[(Nat, BlockType)]]; // List of block changes (index, value)
    tokenRegistry : TokenRegistry; // Block types associated tokens
  };

  public type UpdateChunksComponent = {};

  public type BlockUpdate = (Vector3.Vector3, Nat16); // position, value

  public type UpdateBlocksComponent = {
    blocks : [BlockUpdate];
  };

  public type UnitsChunk = {
    chunkId : Vector3.Vector3;
    updatedAt : Time.Time;
  };

  public type UnitChunksComponent = {
    chunks : [UnitsChunk]; // List of chunk positions
  };

  public type UnitViewComponent = {
    viewRadius : Float; // Radius around the unit to load chunks
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
    #PlaceBlockComponent : PlaceBlockComponent;
    #DamageComponent : DamageComponent;
    #RespawnComponent : RespawnComponent;
    #ImportFungibleComponent : ImportFungibleComponent;
    #UnstakeFungibleComponent : UnstakeFungibleComponent;
    #StakeFungibleComponent : StakeFungibleComponent;
    #UnitChunksComponent : UnitChunksComponent;
    #UnitViewComponent : UnitViewComponent;
    #UpdateUnitChunksComponent : UpdateChunksComponent;

    // Global block store for backend only
    #BlocksComponent : BlocksComponent;
    #UpdateBlocksComponent : UpdateBlocksComponent;
    #UpdateChunksComponent : UpdateChunksComponent;
  };
};
