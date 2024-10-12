import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";
import Const "../utils/Const";

module {
  // Private function to handle TransformComponent logic
  private func handleTransformComponent(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    let defaultTransform = Const.SpawnPoint;

    let transform = switch (ECS.World.getComponent(ctx, entityId, "TransformComponent")) {
      case (? #TransformComponent(transform)) { transform };
      case (_) {
        // Check for a snapshot of the player's transform
        switch (ECS.World.getComponent(ctx, entityId, "OfflineTransformComponent")) {
          case (? #OfflineTransformComponent(transform)) { transform };
          case (_) { defaultTransform };
        };
      };
    };
    ECS.World.addComponent(ctx, entityId, "TransformComponent", #TransformComponent(transform));
  };

  // Private function to handle FungibleComponent logic
  private func handleFungibleComponent(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    let defaultFungible = {
      tokens = [];
    };
    let fungible = switch (ECS.World.getComponent(ctx, entityId, "FungibleComponent")) {
      case (? #FungibleComponent(fungible)) { fungible };
      case (_) { defaultFungible };
    };
    ECS.World.addComponent(ctx, entityId, "FungibleComponent", #FungibleComponent(fungible));
  };

  // Private function to handle HealthComponent logic
  private func handleHealthComponent(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    let default = {
      amount = 10;
      max = 10;
    };
    let health = switch (ECS.World.getComponent(ctx, entityId, "HealthComponent")) {
      case (? #HealthComponent(health)) { health };
      case (_) { default };
    };
    ECS.World.addComponent(ctx, entityId, "HealthComponent", #HealthComponent(health));
  };

  // Private function to handle PlayerViewComponent logic
  private func handlePlayerViewComponent(
    ctx : ECS.Types.Context<Components.Component>,
    entityId : ECS.Types.EntityId,
  ) {
    let defaultView = {
      viewRadius = Const.DEFAULT_VIEW_RADIUS;
    };
    let playerView = switch (ECS.World.getComponent(ctx, entityId, "PlayerViewComponent")) {
      case (? #PlayerViewComponent(playerView)) { playerView };
      case (_) { defaultView };
    };
    ECS.World.addComponent(ctx, entityId, "PlayerViewComponent", #PlayerViewComponent(playerView));
  };

  // Private function to handle PlayerChunksComponent logic
  private func handlePlayerChunksComponent(
    ctx : ECS.Types.Context<Components.Component>,
    entityId : ECS.Types.EntityId,
  ) {
    let defaultChunks = {
      chunks = [];
    };
    let chunks = switch (ECS.World.getComponent(ctx, entityId, "PlayerChunksComponent")) {
      case (? #PlayerChunksComponent(chunks)) { chunks };
      case (_) { defaultChunks };
    };
    ECS.World.addComponent(ctx, entityId, "PlayerChunksComponent", #PlayerChunksComponent(chunks));
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _ : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "ConnectComponent")) {
      case (? #ConnectComponent({ principal })) {
        // Remove DisconnectComponent if it exists
        ECS.World.removeComponent(ctx, entityId, "DisconnectComponent");

        // Add the principal component
        ECS.World.addComponent(ctx, entityId, "PrincipalComponent", #PrincipalComponent({ principal }));

        handleTransformComponent(ctx, entityId);
        handleFungibleComponent(ctx, entityId);
        handleHealthComponent(ctx, entityId);
        handlePlayerViewComponent(ctx, entityId);
        handlePlayerChunksComponent(ctx, entityId);

        // Trigger terrain generation
        ECS.World.addComponent(ctx, entityId, "UpdatePlayerChunksComponent", #UpdatePlayerChunksComponent({}));

        // Start a session
        let session = #SessionComponent({ lastAction = Time.now() });
        ECS.World.addComponent(ctx, entityId, "SessionComponent", session);

        // Remove the connect component
        ECS.World.removeComponent(ctx, entityId, "ConnectComponent");
      };
      case (_) {};
    };
  };

  public let ConnectSystem : ECS.Types.System<Components.Component> = {
    systemType = "ConnectSystem";
    archetype = ["ConnectComponent"];
    update = update;
  };
};
