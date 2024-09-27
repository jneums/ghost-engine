import ECS "mo:geecs";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Components "../components";
import Math "../math";

module {
  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, deltaTime : Time.Time) : () {
    switch (
      ECS.World.getComponent(ctx, entityId, "MiningComponent"),
      ECS.World.getComponent(ctx, entityId, "CargoComponent"),
      ECS.World.getComponent(ctx, entityId, "PrincipalComponent"),
      ECS.World.getComponent(ctx, entityId, "TransformComponent"),
    ) {
      case (
        ? #MiningComponent(mining),
        ? #CargoComponent(cargo),
        ? #PrincipalComponent(principal),
        ? #TransformComponent(transform),
      ) {
        // Calculate the time elapsed since the mining started
        let currentTime = Time.now();
        let elapsedTime = currentTime - mining.startAt;

        // Range check (must be within range of the target)
        // Get the node by entityId and find its transform.position
        let nodeTransform = ECS.World.getComponent(ctx, mining.targetEntityId, "TransformComponent");
        let isInRange = switch (nodeTransform) {
          case (? #TransformComponent(nodeTransform)) {
            let distance = Math.distance(transform.position, nodeTransform.position);

            Debug.print("\nDistance: " # debug_show (distance));

            distance <= mining.range;
          };
          case (_) { false };
        };

        // Check if the player has enough cargo space
        let hasCargoSpace = cargo.current < cargo.capacity;

        // If not in range, stop mining
        if (not isInRange or not hasCargoSpace) {
          Debug.print("\nMining stopped: " # debug_show (isInRange) # " " # debug_show (hasCargoSpace));
          ECS.World.removeComponent(ctx, entityId, "MiningComponent");
          return;
        };

        // Check if the mining is complete
        let elapsedInSeconds = Float.fromInt(elapsedTime) / 1_000_000_000.0;
        Debug.print("\nElapsed time: " # debug_show (elapsedInSeconds));
        if (elapsedInSeconds >= mining.speed) {

          let newCargo = #CargoComponent({
            capacity = cargo.capacity;
            current = cargo.current + 1;
          });
          ECS.World.addComponent(ctx, entityId, "CargoComponent", newCargo);
          ECS.World.removeComponent(ctx, entityId, "MiningComponent");

          // Remove the node
          ECS.World.removeComponent(ctx, mining.targetEntityId, "TransformComponent");
          ECS.World.removeComponent(ctx, mining.targetEntityId, "ResourceComponent");
        };
      };
      case (_) {};
    };
  };

  public let MiningSystem : ECS.Types.System<Components.Component> = {
    systemType = "MiningSystem";
    archetype = ["PrincipalComponent", "MiningComponent", "CargoComponent", "TransformComponent"];
    update = update;
  };
};
