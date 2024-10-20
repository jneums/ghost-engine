import { test; suite; expect } "mo:test";

import ECS "mo:geecs";
import Principal "mo:base/Principal";
import Components "../../components";
import Disconnect "../../actions/Disconnect";
import Utils "../Utils";

suite(
  "Disconnect Action",
  func() {

    // Initialize the entity counter:
    var entityCounter : Nat = 0;
    let nextEntityId = func() : Nat {
      entityCounter += 1;
      entityCounter;
    };

    // Initialize the required ECS data structures:
    let ctx : ECS.Types.Context<Components.Component> = Utils.createContext(nextEntityId);

    // Create a new entity with a principal component
    let entityId = ECS.World.addEntity(ctx);
    let principal = #PrincipalComponent({
      principal = Principal.fromText("nct3x-dynci-pak");
    });
    ECS.World.addComponent(ctx, entityId, "PrincipalComponent", principal);

    test(
      "Can handle a unit disconnect",
      func() {

        // Test the action
        let args = {
          principal = Principal.fromText("nct3x-dynci-pak");
        };
        Disconnect.Handler.handle(ctx, args);

        // Check the entity has a position component
        let position = ECS.World.getComponent(ctx, entityId, "TransformComponent");
        expect.option(position, Utils.componentToText, Utils.componentEqual).isNull();
      },
    );
  },
);
