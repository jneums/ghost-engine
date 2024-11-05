import ECS "mo:geecs";
import Time "mo:base/Time";
import Components "../components";
import Const "../utils/Const";
import TokenRegistry "../utils/TokenRegistry";
import Tokens "../utils/Tokens";

module {
  // Private function to handle TransformComponent logic
  private func handleTransformComponent(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    let defaultTransform = Const.SpawnPoint;

    let transform = switch (ECS.World.getComponent(ctx, entityId, "TransformComponent")) {
      case (? #TransformComponent(transform)) { transform };
      case (_) { defaultTransform };
    };
    ECS.World.addComponent(ctx, entityId, "TransformComponent", #TransformComponent(transform));
  };

  // Private function to handle FungibleComponent logic
  private func handleFungibleComponent(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) {
    let defaultFungible = {
      tokens = [Tokens.getTokenWithAmount(TokenRegistry.Energy, Tokens.toBaseUnit(5, TokenRegistry.Energy.decimals))];
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

  // Private function to handle UnitViewComponent logic
  private func handleUnitViewComponent(
    ctx : ECS.Types.Context<Components.Component>,
    entityId : ECS.Types.EntityId,
  ) {
    let defaultView = {
      viewRadius = Const.DEFAULT_VIEW_RADIUS;
    };
    let unitView = switch (ECS.World.getComponent(ctx, entityId, "UnitViewComponent")) {
      case (? #UnitViewComponent(unitView)) { unitView };
      case (_) { defaultView };
    };
    ECS.World.addComponent(ctx, entityId, "UnitViewComponent", #UnitViewComponent(unitView));
  };

  // Private function to handle UnitChunksComponent logic
  private func handleUnitChunksComponent(
    ctx : ECS.Types.Context<Components.Component>,
    entityId : ECS.Types.EntityId,
  ) {
    let defaultChunks = {
      chunks = [];
    };
    let chunks = switch (ECS.World.getComponent(ctx, entityId, "UnitChunksComponent")) {
      case (? #UnitChunksComponent(chunks)) { chunks };
      case (_) { defaultChunks };
    };
    ECS.World.addComponent(ctx, entityId, "UnitChunksComponent", #UnitChunksComponent(chunks));
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
        handleUnitViewComponent(ctx, entityId);
        handleUnitChunksComponent(ctx, entityId);

        // Trigger terrain generation
        ECS.World.addComponent(ctx, entityId, "UpdateUnitChunksComponent", #UpdateUnitChunksComponent({}));

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
