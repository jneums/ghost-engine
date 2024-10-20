import { test; suite; expect } "mo:test/async";

import ECS "mo:geecs";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Components "../../components";
import { UnitViewSystem } "../../systems/UnitViewSystem";
import Utils "../Utils";
import Vector3 "../../math/Vector3";

suite(
  "Unit View System",
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

    // Add a UnitViewComponent and TransformComponent to the entity
    let unitView = #UnitViewComponent({
      viewRadius = 16.0;
    });
    ECS.World.addComponent(ctx, entityId, "UnitViewComponent", unitView);

    let transform = #TransformComponent({
      scale = { x = 1.0; y = 1.0; z = 1.0 };
      position = { x = 0.0; y = 0.0; z = 0.0 };
      rotation = { x = 0.0; y = 0.0; z = 0.0; w = 0.0 };
    });
    ECS.World.addComponent(ctx, entityId, "TransformComponent", transform);

    let chunks = #UnitChunksComponent({
      chunks = [];
    });
    ECS.World.addComponent(ctx, entityId, "UnitChunksComponent", chunks);

    let updateChunks = #UpdateUnitChunksComponent({});
    ECS.World.addComponent(ctx, entityId, "UpdateUnitChunksComponent", updateChunks);

    await test(
      "Can receive new chunks around origin when starting at 0,0",
      func() : async () {

        // Run the UnitViewSystem update
        await UnitViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allUnitChunks = ECS.World.getComponent(ctx, entityId, "UnitChunksComponent");
        switch (allUnitChunks) {
          case (? #UnitChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);
            let visibleChunks = [
              {
                chunkId = { x = -1.0; y = 0.0; z = -1.0 };
                updatedAt = Time.now();
              },
              {
                chunkId = { x = -1.0; y = 0.0; z = 0.0 };
                updatedAt = Time.now();
              },
              {
                chunkId = { x = -1.0; y = 0.0; z = 1.0 };
                updatedAt = Time.now();
              },
              {
                chunkId = { x = 0.0; y = 0.0; z = -1.0 };
                updatedAt = Time.now();
              },
              {
                chunkId = { x = 0.0; y = 0.0; z = 0.0 };
                updatedAt = Time.now();
              },
              {
                chunkId = { x = 0.0; y = 0.0; z = 1.0 };
                updatedAt = Time.now();
              },
              {
                chunkId = { x = 1.0; y = 0.0; z = -1.0 };
                updatedAt = Time.now();
              },
              {
                chunkId = { x = 1.0; y = 0.0; z = 0.0 };
                updatedAt = Time.now();
              },
              {
                chunkId = { x = 1.0; y = 0.0; z = 1.0 };
                updatedAt = Time.now();
              },
            ];
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

        // Run the UnitViewSystem update
        await UnitViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allUnitChunks = ECS.World.getComponent(ctx, entityId, "UnitChunksComponent");
        switch (allUnitChunks) {
          case (? #UnitChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);

            let visibleChunks = [
              { x = -1.0; y = 0.0; z = 0.0 },
              { x = -1.0; y = 0.0; z = 1.0 },
              { x = -1.0; y = 0.0; z = 2.0 },
              { x = 0.0; y = 0.0; z = 0.0 },
              { x = 0.0; y = 0.0; z = 1.0 },
              { x = 0.0; y = 0.0; z = 2.0 },
              { x = 1.0; y = 0.0; z = 0.0 },
              { x = 1.0; y = 0.0; z = 1.0 },
              { x = 1.0; y = 0.0; z = 2.0 },
            ];
            // expect.array(chunks.chunks, func(x : Vector3.Vector3) : Text { debug_show (x) }, Vector3.equal).equal(visibleChunks);
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

        // Run the UnitViewSystem update
        await UnitViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allUnitChunks = ECS.World.getComponent(ctx, entityId, "UnitChunksComponent");
        switch (allUnitChunks) {
          case (? #UnitChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);

            let visibleChunks = [
              { x = -1.0; y = 0.0; z = 0.0 },
              { x = -1.0; y = 0.0; z = 1.0 },
              { x = -1.0; y = 0.0; z = 2.0 },
              { x = 0.0; y = 0.0; z = 0.0 },
              { x = 0.0; y = 0.0; z = 1.0 },
              { x = 0.0; y = 0.0; z = 2.0 },
              { x = 1.0; y = 0.0; z = 0.0 },
              { x = 1.0; y = 0.0; z = 1.0 },
              { x = 1.0; y = 0.0; z = 2.0 },
            ];
            // expect.array(chunks.chunks, func(x : Vector3.Vector3) : Text { debug_show (x) }, Vector3.equal).equal(visibleChunks);
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

        // Run the UnitViewSystem update
        await UnitViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allUnitChunks = ECS.World.getComponent(ctx, entityId, "UnitChunksComponent");
        switch (allUnitChunks) {
          case (? #UnitChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);

            let visibleChunks = [
              { x = 0.0; y = 0.0; z = -1.0 },
              { x = 0.0; y = 0.0; z = 0.0 },
              { x = 0.0; y = 0.0; z = 1.0 },
              { x = 1.0; y = 0.0; z = -1.0 },
              { x = 1.0; y = 0.0; z = 0.0 },
              { x = 1.0; y = 0.0; z = 1.0 },
              { x = 2.0; y = 0.0; z = -1.0 },
              { x = 2.0; y = 0.0; z = 0.0 },
              { x = 2.0; y = 0.0; z = 1.0 },
            ];
            // expect.array(chunks.chunks, func(x : Vector3.Vector3) : Text { debug_show (x) }, Vector3.equal).equal(visibleChunks);
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

        // Run the UnitViewSystem update
        await UnitViewSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allUnitChunks = ECS.World.getComponent(ctx, entityId, "UnitChunksComponent");
        switch (allUnitChunks) {
          case (? #UnitChunksComponent(chunks)) {
            expect.nat(Array.size(chunks.chunks)).equal(9);

            let visibleChunks = [
              { x = -2.0; y = 0.0; z = -1.0 },
              { x = -2.0; y = 0.0; z = 0.0 },
              { x = -2.0; y = 0.0; z = 1.0 },
              { x = -1.0; y = 0.0; z = -1.0 },
              { x = -1.0; y = 0.0; z = 0.0 },
              { x = -1.0; y = 0.0; z = 1.0 },
              { x = 0.0; y = 0.0; z = -1.0 },
              { x = 0.0; y = 0.0; z = 0.0 },
              { x = 0.0; y = 0.0; z = 1.0 },
            ];
            // expect.array(chunks.chunks, func(x : Vector3.Vector3) : Text { debug_show (x) }, Vector3.equal).equal(visibleChunks);
          };
          case (_) {};
        };
      },
    );
  },
);
