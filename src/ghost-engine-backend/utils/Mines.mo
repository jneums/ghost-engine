import ECS "mo:geecs";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Components "../components";

module {
  // Initialize mining nodes
  public func initialize(ctx : ECS.Types.Context<Components.Component>) {
    let MAX_MINES = 5;
    let mines = ECS.World.getEntitiesByArchetype(ctx, ["ResourceComponent"]);
    let numMines = Array.size(mines);
    var minesNeeded = if (MAX_MINES > numMines) { MAX_MINES - numMines : Nat } else {
      0;
    };

    Debug.print("Current mines: " # debug_show (numMines) # " Mines needed: " # debug_show (minesNeeded));

    while (minesNeeded > 0) {
      let entityId = ECS.World.addEntity(ctx);
      ECS.World.addComponent(ctx, entityId, "ResourceComponent", #ResourceComponent({ resourceType = "tENGINE" }));
      ECS.World.addComponent(ctx, entityId, "NameableComponent", #NameableComponent({ name = "tENGINE Block" }));
      ECS.World.addComponent(ctx, entityId, "HealthComponent", #HealthComponent({ amount = 3; max = 3 }));
      ECS.World.addComponent(ctx, entityId, "RespawnComponent", #RespawnComponent({ deathTime = Time.now(); duration = 0 }));
      minesNeeded -= 1;
    };
  };
};
