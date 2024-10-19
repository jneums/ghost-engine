import { test; suite } "mo:test";
import Chunks "../../utils/Chunks";

suite(
  "Block Utilities",
  func() {

    test(
      "Get block position",
      func() {
        let chunkPos = { x = 0.0; y = 0.0; z = 0.0 };
        let blockIndex = 21; // Example index
        let expectedPos = { x = 5.0; y = 1.0; z = 0.0 }; // Expected position for index 21 in a 16x16x16 chunk

        let result = Chunks.getBlockPosition(chunkPos, blockIndex);
        assert expectedPos == result;
      },
    );
  },
);
