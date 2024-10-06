import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";

module {
  // Private function to handle TransformComponent logic
  private func handleTransformComponent(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    let transform = switch (ECS.World.getComponent(ctx, entityId, "TransformComponent")) {
      case (? #TransformComponent(transform)) {
        transform;
      };
      case (_) {
        // Check for a snapshot of the player's transform
        switch (ECS.World.getComponent(ctx, entityId, "OfflineTransformComponent")) {
          case (? #OfflineTransformComponent(transform)) {
            transform;
          };
          case (_) {
            {
              scale = { x = 1.0; y = 1.0; z = 1.0 };
              rotation = { x = 0.0; y = 0.0; z = 0.0; w = 0.0 };
              position = { x = 0.0; y = 0.0; z = 0.0 };
            };
          };
        };
      };
    };
    ECS.World.addComponent(ctx, entityId, "TransformComponent", #TransformComponent(transform));
  };

  // Private function to handle FungibleComponent logic
  private func handleFungibleComponent(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    let fungible = switch (ECS.World.getComponent(ctx, entityId, "FungibleComponent")) {
      case (? #FungibleComponent(fungible)) {
        fungible;
      };
      case (_) {
        {
          tokens = [];
        };
      };
    };
    ECS.World.addComponent(ctx, entityId, "FungibleComponent", #FungibleComponent(fungible));
  };

  // Private function to handle HealthComponent logic
  private func handleHealthComponent(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    let health = switch (ECS.World.getComponent(ctx, entityId, "HealthComponent")) {
      case (? #HealthComponent(health)) {
        health;
      };
      case (_) {
        {
          amount = 10;
          max = 10;
        };
      };
    };
    ECS.World.addComponent(ctx, entityId, "HealthComponent", #HealthComponent(health));
  };

  // Private function to handle PlayerViewComponent logic
  private func handlePlayerViewComponent(
    ctx : ECS.Types.Context<Components.Component>,
    entityId : ECS.Types.EntityId,
  ) {
    let playerView = switch (ECS.World.getComponent(ctx, entityId, "PlayerViewComponent")) {
      case (? #PlayerViewComponent(playerView)) {
        playerView;
      };
      case (_) {
        {
          viewRadius = 16.0;
        };
      };
    };
    ECS.World.addComponent(ctx, entityId, "PlayerViewComponent", #PlayerViewComponent(playerView));
  };

  // Private function to handle ChunksComponent logic
  private func handleChunksComponent(
    ctx : ECS.Types.Context<Components.Component>,
    entityId : ECS.Types.EntityId,
  ) {
    let chunks = switch (ECS.World.getComponent(ctx, entityId, "ChunksComponent")) {
      case (? #ChunksComponent(chunks)) {
        chunks;
      };
      case (_) {
        {
          chunks = [];
        };
      };
    };
    ECS.World.addComponent(ctx, entityId, "ChunksComponent", #ChunksComponent(chunks));
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _ : Time.Time) : async () {
    switch (ECS.World.getComponent(ctx, entityId, "ConnectComponent")) {
      case (? #ConnectComponent(_)) {
        handleTransformComponent(ctx, entityId);
        handleFungibleComponent(ctx, entityId);
        handleHealthComponent(ctx, entityId);
        handlePlayerViewComponent(ctx, entityId);
        handleChunksComponent(ctx, entityId);

        // Trigger terrain generation
        ECS.World.addComponent(ctx, entityId, "UpdateChunksComponent", #UpdateChunksComponent({}));

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
