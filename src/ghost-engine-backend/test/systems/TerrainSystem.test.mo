import { test; suite; expect } "mo:test/async";

import ECS "mo:geecs";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Components "../../components";
import { TerrainSystem } "../../systems/TerrainSystem";
import Utils "../Utils";
import Entities "../../utils/Entities";

suite(
  "Terrain System",
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

    await test(
      "Can receive new chunks around origin when starting at 0,0",
      func() : async () {

        // Run the TerrainSystem update
        await TerrainSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allChunks = ECS.World.getEntitiesByArchetype(ctx, ["ChunkComponent"]);
        expect.nat(Array.size(allChunks)).equal(9);

        let visibleEntities = Entities.filterByRange(ctx, entityId);
        expect.nat(Array.size(visibleEntities)).equal(10); // Add 1 for the player entity
        expect.array(visibleEntities, Nat.toText, Nat.equal).equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
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

        // Run the TerrainSystem update
        await TerrainSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allChunks = ECS.World.getEntitiesByArchetype(ctx, ["ChunkComponent"]);
        expect.nat(Array.size(allChunks)).equal(12);

        let visibleEntities = Entities.filterByRange(ctx, entityId);
        expect.nat(Array.size(visibleEntities)).equal(10);
        expect.array(visibleEntities, Nat.toText, Nat.equal).equal([1, 3, 4, 6, 7, 9, 10, 11, 12, 13]);
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

        // Run the TerrainSystem update
        await TerrainSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allChunks = ECS.World.getEntitiesByArchetype(ctx, ["ChunkComponent"]);
        expect.nat(Array.size(allChunks)).equal(12);

        let visibleEntities = Entities.filterByRange(ctx, entityId);
        expect.nat(Array.size(visibleEntities)).equal(10);
        expect.array(visibleEntities, Nat.toText, Nat.equal).equal([1, 3, 4, 6, 7, 9, 10, 11, 12, 13]);
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

        // Run the TerrainSystem update
        await TerrainSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allChunks = ECS.World.getEntitiesByArchetype(ctx, ["ChunkComponent"]);
        expect.nat(Array.size(allChunks)).equal(15);

        let visibleEntities = Entities.filterByRange(ctx, entityId);
        expect.nat(Array.size(visibleEntities)).equal(10);
        expect.array(visibleEntities, Nat.toText, Nat.equal).equal([1, 5, 6, 7, 8, 9, 10, 14, 15, 16]);

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

        // Run the TerrainSystem update
        await TerrainSystem.update(ctx, entityId, 0);

        // Check that new chunks were loaded
        let allChunks = ECS.World.getEntitiesByArchetype(ctx, ["ChunkComponent"]);
        expect.nat(Array.size(allChunks)).equal(18);

        let visibleEntities = Entities.filterByRange(ctx, entityId);
        expect.nat(Array.size(visibleEntities)).equal(10);
        expect.array(visibleEntities, Nat.toText, Nat.equal).equal([1, 2, 3, 4, 5, 6, 7, 17, 18, 19]);
      },
    );
  },
);
