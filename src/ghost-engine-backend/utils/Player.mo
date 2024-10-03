import ECS "mo:geecs";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Components "../components";

module {
  public func getPrincipal(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId) : ?Principal {
    switch (ECS.World.getComponent(ctx, entityId, "PrincipalComponent")) {
      case (?exists) {
        switch (exists) {
          case (#PrincipalComponent({ principal })) {
            return ?principal;
          };
          case (_) { return null };
        };
      };
      case (null) { return null };
    };
  };

  public func findPlayersEntityId(ctx : ECS.Types.Context<Components.Component>, principal : Principal) : ?ECS.Types.EntityId {
    // Get all players in the simulation
    let playerIds = ECS.World.getEntitiesByArchetype(
      ctx,
      ["PrincipalComponent"],
    );
    // Find the player with the matching principal and remove them from the simulation
    var res : ?ECS.Types.EntityId = null;
    label findPrincipal for (playerId in Iter.fromArray(playerIds)) {
      switch (getPrincipal(ctx, playerId)) {
        case (?exists) {
          if (exists == principal) {
            res := ?playerId;
            break findPrincipal;
          };
        };
        case (null) {};
      };
    };
    return res;
  };

  public func getActiveSessions(ctx : ECS.Types.Context<Components.Component>) : {
    active : [ECS.Types.EntityId];
    connecting : [ECS.Types.EntityId];
    disconnecting : [ECS.Types.EntityId];
    total : Int;
  } {
    // Get all players in the simulation
    let active = ECS.World.getEntitiesByArchetype(
      ctx,
      ["PrincipalComponent", "SessionComponent"],
    );

    let connecting = ECS.World.getEntitiesByArchetype(
      ctx,
      ["PrincipalComponent", "ConnectComponent"],
    );

    let disconnecting = ECS.World.getEntitiesByArchetype(
      ctx,
      ["PrincipalComponent", "DisconnectComponent"],
    );

    return {
      active;
      connecting;
      disconnecting;
      total = Array.size(active) + Array.size(connecting) + Array.size(disconnecting);
    };
  };

  public func updateSession(ctx : ECS.Types.Context<Components.Component>, principal : Principal) {
    let entityId = findPlayersEntityId(ctx, principal);
    switch (entityId) {
      case (?exists) {
        ECS.World.addComponent(
          ctx,
          exists,
          "SessionComponent",
          #SessionComponent({
            lastAction = Time.now();
          }),
        );
      };
      case (null) {};
    };
  };
};
