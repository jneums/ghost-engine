import { test; suite; expect } "mo:test";

import ECS "mo:geecs";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Components "../../components";
import Player "../../utils/Player";

suite(
  "Player",
  func() {

    // Initialize the entity counter:
    var entityCounter : Nat = 0;

    type Component = Components.Component;
    // Initialize the required ECS data structures:
    let ctx : ECS.Types.Context<Component> = {
      entities = ECS.State.Entities.new<Component>();
      registeredSystems = ECS.State.SystemRegistry.new<Component>();
      systemsEntities = ECS.State.SystemsEntities.new();
      updatedComponents = ECS.State.UpdatedComponents.new<Component>();

      // Incrementing entity counter for ids.
      nextEntityId = func() : Nat {
        entityCounter += 1;
        entityCounter;
      };
    };

    // Create a new entity with a principal component
    let entityId = ECS.World.addEntity(ctx);
    let principal = #PrincipalComponent({
      principal = Principal.fromText("nct3x-dynci-pak");
    });
    ECS.World.addComponent(ctx, entityId, "PrincipalComponent", principal);

    // Test cases
    test(
      "Can get an entities principal",
      func() {

        // Get the principal
        let result = Player.getPrincipal(ctx, entityId);
        expect.option(result, Principal.toText, Principal.equal).equal(?Principal.fromText("nct3x-dynci-pak"));
      },
    );

    test(
      "Can find an entities entityId by principal",
      func() {

        // Find the entity by principal
        let result = Player.findPlayersEntityId(ctx, Principal.fromText("nct3x-dynci-pak"));
        expect.option(result, Nat.toText, Nat.equal).equal(?entityId);
      },
    );
  },
);
