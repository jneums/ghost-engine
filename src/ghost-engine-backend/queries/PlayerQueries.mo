import ECS "mo:geecs";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
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
};
