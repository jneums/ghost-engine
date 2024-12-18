import ECS "mo:geecs";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Components "../components";
import Vector3 "../math/Vector3";

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

  public func getEntityId(ctx : ECS.Types.Context<Components.Component>, principal : Principal) : ?ECS.Types.EntityId {
    // Get all units in the simulation
    let unitIds = ECS.World.getEntitiesByArchetype(
      ctx,
      ["PrincipalComponent"],
    );
    // Find the unit with the matching principal and remove them from the simulation
    var res : ?ECS.Types.EntityId = null;
    label findPrincipal for (unitId in Iter.fromArray(unitIds)) {
      switch (getPrincipal(ctx, unitId)) {
        case (?exists) {
          if (exists == principal) {
            res := ?unitId;
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
    // Get all units in the simulation
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
    let entityId = getEntityId(ctx, principal);
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

  public func getChunks(ctx : ECS.Types.Context<Components.Component>, principal : Principal) : [Components.UnitsChunk] {
    switch (getEntityId(ctx, principal)) {
      case (?exists) {
        let chunks = ECS.World.getComponent(ctx, exists, "UnitChunksComponent");
        switch (chunks) {
          case (? #UnitChunksComponent({ chunks })) {
            return chunks;
          };
          case (_) { return [] };
        };
      };
      case (null) { return [] };
    };
  };

  public func hasChunk(ctx : ECS.Types.Context<Components.Component>, principal : Principal, chunkId : Vector3.Vector3) : Bool {
    let chunks = getChunks(ctx, principal);
    for (chunk in chunks.vals()) {
      if (Vector3.equal(chunk.chunkId, chunkId)) {
        return true;
      };
    };
    return false;
  };
};
