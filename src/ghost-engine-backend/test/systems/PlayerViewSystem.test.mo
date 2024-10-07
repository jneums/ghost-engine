import { test; suite; expect } "mo:test/async";

import ECS "mo:geecs";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Components "../../components";
import { PlayerViewSystem } "../../systems/PlayerViewSystem";
import Utils "../Utils";

suite(
  "Player View System",
  func() : async () {

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

    // Add a PlayerViewComponent and TransformComponent to the entity
    let playerView = #PlayerViewComponent({
      viewRadius = 16.0;
    });
    ECS.World.addComponent(ctx, entityId, "PlayerViewComponent", playerView);

    let transform = #TransformComponent({
      scale = { x = 1.0; y = 1.0; z = 1.0 };
      position = { x = 0.0; y = 0.0; z = 0.0 };
      rotation = { x = 0.0; y = 0.0; z = 0.0; w = 0.0 };
    });
    ECS.World.addComponent(ctx, entityId, "TransformComponent", transform);

    let chunks = #PlayerChunksComponent({
      chunks = [];
    });
    ECS.World.addComponent(ctx, entityId, "PlayerChunksComponent", chunks);

    let updateChunks = #UpdatePlayerChunksComponent({});
    ECS.World.addComponent(ctx, entityId, "UpdatePlayerChunksComponent", updateChunks);

    await test(
      "Can receive new chunks around origin when starting at 0,0",
      func() : async () {

        // Run the PlayerViewSystem update
        await PlayerViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allPlayerChunks = ECS.World.getComponent(ctx, entityId, "PlayerChunksComponent");
        switch (allPlayerChunks) {
          case (? #PlayerChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);

            let visibleChunks = ["-1,0,-1", "-1,0,0", "-1,0,1", "0,0,-1", "0,0,0", "0,0,1", "1,0,-1", "1,0,0", "1,0,1"];
            expect.array(chunks.chunks, func(x : Text) : Text { x }, Text.equal).equal(visibleChunks);
          };
          case (_) {};
        };
      },
    );

    await test(
      "Can receive updated set of chunks when moving one chunk in the z direction",
      func() : async () {

        let transform = #TransformComponent({
          scale = { x = 1.0; y = 1.0; z = 1.0 };
          position = { x = 0.0; y = 0.0; z = 16.0 };
          rotation = { x = 0.0; y = 0.0; z = 0.0; w = 0.0 };
        });
        ECS.World.addComponent(ctx, entityId, "TransformComponent", transform);

        // Run the PlayerViewSystem update
        await PlayerViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allPlayerChunks = ECS.World.getComponent(ctx, entityId, "PlayerChunksComponent");
        switch (allPlayerChunks) {
          case (? #PlayerChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);

            let visibleChunks = ["-1,0,0", "-1,0,1", "-1,0,2", "0,0,0", "0,0,1", "0,0,2", "1,0,0", "1,0,1", "1,0,2"];
            expect.array(chunks.chunks, func(x : Text) : Text { x }, Text.equal).equal(visibleChunks);
          };
          case (_) {};
        };
      },
    );

    await test(
      "Can receive same chunks if moving half a chunk in the z direction",
      func() : async () {

        let transform = #TransformComponent({
          scale = { x = 1.0; y = 1.0; z = 1.0 };
          position = { x = 0.0; y = 0.0; z = 24.0 };
          rotation = { x = 0.0; y = 0.0; z = 0.0; w = 0.0 };
        });
        ECS.World.addComponent(ctx, entityId, "TransformComponent", transform);

        // Run the PlayerViewSystem update
        await PlayerViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allPlayerChunks = ECS.World.getComponent(ctx, entityId, "PlayerChunksComponent");
        switch (allPlayerChunks) {
          case (? #PlayerChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);

            let visibleChunks = ["-1,0,1", "-1,0,2", "-1,0,3", "0,0,1", "0,0,2", "0,0,3", "1,0,1", "1,0,2", "1,0,3"];
            expect.array(chunks.chunks, func(x : Text) : Text { x }, Text.equal).equal(visibleChunks);
          };
          case (_) {};
        };

      },
    );

    await test(
      "Can receive new chunks and removed chunks when moving one chunk in x direction",
      func() : async () {

        let transform = #TransformComponent({
          scale = { x = 1.0; y = 1.0; z = 1.0 };
          position = { x = 16.0; y = 0.0; z = 0.0 };
          rotation = { x = 0.0; y = 0.0; z = 0.0; w = 0.0 };
        });
        ECS.World.addComponent(ctx, entityId, "TransformComponent", transform);

        // Run the PlayerViewSystem update
        await PlayerViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allPlayerChunks = ECS.World.getComponent(ctx, entityId, "PlayerChunksComponent");
        switch (allPlayerChunks) {
          case (? #PlayerChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);

            let visibleChunks = ["0,0,-1", "0,0,0", "0,0,1", "1,0,-1", "1,0,0", "1,0,1", "2,0,-1", "2,0,0", "2,0,1"];
            expect.array(chunks.chunks, func(x : Text) : Text { x }, Text.equal).equal(visibleChunks);
          };
          case (_) {};
        };

      },
    );

    await test(
      "Can move into negative x direction and receive new chunks and removed chunks",
      func() : async () {

        let transform = #TransformComponent({
          scale = { x = 1.0; y = 1.0; z = 1.0 };
          position = { x = -16.0; y = 0.0; z = 0.0 };
          rotation = { x = 0.0; y = 0.0; z = 0.0; w = 0.0 };
        });
        ECS.World.addComponent(ctx, entityId, "TransformComponent", transform);

        // Run the PlayerViewSystem update
        await PlayerViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allPlayerChunks = ECS.World.getComponent(ctx, entityId, "PlayerChunksComponent");
        switch (allPlayerChunks) {
          case (? #PlayerChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);

            let visibleChunks = ["-2,0,-1", "-2,0,0", "-2,0,1", "-1,0,-1", "-1,0,0", "-1,0,1", "0,0,-1", "0,0,0", "0,0,1"];
            expect.array(chunks.chunks, func(x : Text) : Text { x }, Text.equal).equal(visibleChunks);
          };
          case (_) {};
        };
      },
    );
  },
);
