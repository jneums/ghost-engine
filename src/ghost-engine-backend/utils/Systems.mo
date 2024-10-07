import ECS "mo:geecs";
import Components "../components";

import { MovementSystem } "../systems/MovementSystem";
import { CombatSystem } "../systems/CombatSystem";
import { DamageSystem } "../systems/DamageSystem";
import { SpawnSystem } "../systems/SpawnSystem";
import { RewardSystem } "../systems/RewardSystem";
import { ConnectSystem } "../systems/ConnectSystem";
import { DisconnectSystem } "../systems/DisconnectSystem";
import { SessionSystem } "../systems/SessionSystem";
import { PlayerViewSystem } "../systems/PlayerViewSystem";
import { BlocksSystem } "../systems/BlocksSystem";

module {
  // Register systems
  public func register(ctx : ECS.Types.Context<Components.Component>) {
    ECS.World.addSystem(ctx, ConnectSystem);
    ECS.World.addSystem(ctx, SessionSystem);
    ECS.World.addSystem(ctx, PlayerViewSystem);
    ECS.World.addSystem(ctx, MovementSystem);
    ECS.World.addSystem(ctx, DamageSystem);
    ECS.World.addSystem(ctx, CombatSystem);
    ECS.World.addSystem(ctx, RewardSystem);
    ECS.World.addSystem(ctx, SpawnSystem);
    ECS.World.addSystem(ctx, BlocksSystem);
    ECS.World.addSystem(ctx, DisconnectSystem);
  };
};
