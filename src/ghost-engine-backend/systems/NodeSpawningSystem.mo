import ECS "mo:geecs";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import Array "mo:base/Array";
import Components "../components";
import Math "../math";
import Random "mo:noise/Random";

module {
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _ : Time.Time) : () {
    switch (ECS.World.getComponent(ctx, entityId, "NodeSpawningComponent")) {
      case (? #NodeSpawningComponent({ maxNodes; spawnInterval; lastSpawn; spawnBoundary })) {
        let currentTime = Time.now();
        let elapsedTime = currentTime - lastSpawn;

        let currentNodes = ECS.World.getEntitiesByArchetype(ctx, ["TransformComponent", "ResourceComponent"]);

        if (elapsedTime >= spawnInterval and Array.size(currentNodes) < maxNodes) {
          let xoro = Random.xSetSeed(Nat64.fromNat(Int.abs(currentTime)));
          let x = Random.xNextFloat(xoro);
          let z = Random.xNextFloat(xoro);

          // Convert x and z to the range of the spawn boundary
          let minX = spawnBoundary.minX;
          let maxX = spawnBoundary.maxX;
          let minZ = spawnBoundary.minZ;
          let maxZ = spawnBoundary.maxZ;

          let spawnX = minX + x * (maxX - minX);
          let spawnZ = minZ + z * (maxZ - minZ);

          let newNodePosition = {
            x = spawnX;
            y = 0.0;
            z = spawnZ;
          };

          let newNodeEntityId = ECS.World.addEntity(ctx);
          let newNodeTransform = #TransformComponent({
            position = newNodePosition;
            rotation = Math.eulerToQuaternion({ x = 0.0; y = 0.0; z = 0.0 });
            scale = { x = 1.0; y = 1.0; z = 1.0 };
          });
          ECS.World.addComponent(ctx, newNodeEntityId, "TransformComponent", newNodeTransform);
          let newNodeResource = #ResourceComponent({
            amount = 1;
          });
          ECS.World.addComponent(ctx, newNodeEntityId, "ResourceComponent", newNodeResource);
          ECS.World.addComponent(ctx, newNodeEntityId, "NameableComponent", #NameableComponent({ name = "Mining Node" }));

          // Update the last spawn time and increment the current nodes count
          let newSpawnTime = currentTime;

          let newNodeSpawningComponent = #NodeSpawningComponent({
            maxNodes = maxNodes;
            spawnInterval = spawnInterval;
            lastSpawn = newSpawnTime;
            spawnBoundary = spawnBoundary;
          });

          ECS.World.addComponent(ctx, entityId, "NodeSpawningComponent", newNodeSpawningComponent);
        };
      };
      case (_) {};
    };
  };

  public let NodeSpawningSystem : ECS.Types.System<Components.Component> = {
    systemType = "NodeSpawningSystem";
    archetype = ["NodeSpawningComponent"];
    update = update;
  };
};
