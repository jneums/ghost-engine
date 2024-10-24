import ECS "mo:geecs";
import Components "../components";

import { MovementSystem } "MovementSystem";
import { CombatSystem } "CombatSystem";
import { DamageSystem } "DamageSystem";
import { SpawnSystem } "SpawnSystem";
import { ImportFungibleSystem } "ImportFungibleSystem";
import { UnstakeFungibleSystem } "UnstakeFungibleSystem";
import { StakeFungibleSystem } "StakeFungibleSystem";
import { ConnectSystem } "ConnectSystem";
import { DisconnectSystem } "DisconnectSystem";
import { SessionSystem } "SessionSystem";
import { UnitViewSystem } "UnitViewSystem";
import { MiningSystem } "MiningSystem";
import { PlaceBlockSystem } "PlaceBlockSystem";
import { BlocksSystem } "BlocksSystem";
import { ChunksSystem } "ChunksSystem";

module {
  // Register systems
  public func register(ctx : ECS.Types.Context<Components.Component>) {
    ECS.World.addSystem(ctx, ConnectSystem);
    ECS.World.addSystem(ctx, SessionSystem);
    ECS.World.addSystem(ctx, UnitViewSystem);
    ECS.World.addSystem(ctx, MovementSystem);
    ECS.World.addSystem(ctx, DamageSystem);
    ECS.World.addSystem(ctx, CombatSystem);
    ECS.World.addSystem(ctx, MiningSystem);
    ECS.World.addSystem(ctx, PlaceBlockSystem);
    ECS.World.addSystem(ctx, ImportFungibleSystem);
    ECS.World.addSystem(ctx, UnstakeFungibleSystem);
    ECS.World.addSystem(ctx, StakeFungibleSystem);
    ECS.World.addSystem(ctx, SpawnSystem);
    ECS.World.addSystem(ctx, BlocksSystem);
    ECS.World.addSystem(ctx, ChunksSystem);
    ECS.World.addSystem(ctx, DisconnectSystem);
  };
};
