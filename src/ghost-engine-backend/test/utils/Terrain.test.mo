import { test; suite; expect } "mo:test";
import Array "mo:base/Array";
import Terrain "../../utils/Terrain";
import Const "../../utils/Const";

suite(
  "Block Utilities",
  func() {

    test(
      "Get block position",
      func() {
        let chunkPos = { x = 0.0; y = 0.0; z = 0.0 };
        let blockIndex = 21; // Example index
        let expectedPos = { x = 5.0; y = 1.0; z = 0.0 }; // Expected position for index 21 in a 16x16x16 chunk

        let result = Terrain.getBlockPosition(chunkPos, blockIndex);
        assert expectedPos == result;
      },
    );

    test(
      "Get block type",
      func() {
        let blocks = Array.init<Nat8>(Const.CHUNK_SIZE * Const.CHUNK_HEIGHT * Const.CHUNK_SIZE, 0);
        blocks[21] := 5; // Set block type at index 21

        let result = Terrain.getBlockType(Array.freeze(blocks), 5, 1, 0); // Corresponds to index 21
        expect.nat8(result).equal(5);
      },
    );

    test(
      "Set block type",
      func() {
        let blocks = Array.init<Nat8>(Const.CHUNK_SIZE * Const.CHUNK_HEIGHT * Const.CHUNK_SIZE, 0);

        Terrain.setBlockType(blocks, 5, 1, 0, 7); // Set block type at position (5, 1, 0)
        let result = blocks[21]; // Check the block type at index 21
        expect.nat8(result).equal(7);
      },
    );
  },
);
