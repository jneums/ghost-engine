import Array "mo:base/Array";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Climate "Climate";
import Const "Const";
import Types "Types";

module {

  let SEED = 0 : Nat64;
  let chunkSize = { x = 16; y = 128; z = 16 };

  public func generateChunkBlocks(chunkPos : Types.ChunkPosition) : [Nat16] {
    let blockCount = chunkSize.x * chunkSize.y * chunkSize.z;
    var newBlocks = Array.init<Nat16>(blockCount, 0 : Nat16);
    let climate = Climate.initClimateSeed(SEED);
    let baseOffset = Float.fromInt(64);
    let maxHeight = 128;

    Debug.print("Generating blocks for chunk at position: " # debug_show (chunkPos));
    for (z in Iter.range(0, chunkSize.z - 1)) {
      let globalZ = Float.fromInt(z + chunkPos.z * chunkSize.z);
      for (x in Iter.range(0, chunkSize.x - 1)) {
        let globalX = Float.fromInt(x + chunkPos.x * chunkSize.x);

        // Sample 2D noise for continentalness and erosion
        let continentalness = Climate.sampleClimateNoise(climate, Const.Climate.Continentalness, globalX, 0, globalZ);
        let erosion = Climate.sampleClimateNoise(climate, Const.Climate.Erosion, globalX, 0, globalZ);

        var foundSolidBlock = false;

        label highestY for (y in Iter.revRange(chunkSize.y - 1, 0)) {
          let natY = Int.abs(y); // Convert y to Nat for indexing
          let globalY = Float.fromInt(natY + chunkPos.y * chunkSize.y);

          if (foundSolidBlock) {
            // Fill with stone after first solid block
            let index = x + z * chunkSize.x + natY * chunkSize.z * chunkSize.x;
            newBlocks[index] := 1;
            continue highestY;
          };

          // Sample 3D noise for peaks and valleys
          let peaksAndValleys = Climate.sampleClimateNoise(climate, Const.Climate.PeaksAndValleys, globalX, globalY, globalZ);

          // Calculate height offset using peaks and valleys
          let heightOffset = erosion * (Float.fromInt(maxHeight) - baseOffset) + peaksAndValleys * (Float.fromInt(maxHeight) - baseOffset);

          // Calculate squish factor inversely related to continentalness
          let squishFactor = continentalness;

          // Calculate height bias
          let heightBias = baseOffset + heightOffset * squishFactor;
          let finalDensity = heightBias - globalY;

          let index = x + z * chunkSize.x + natY * chunkSize.z * chunkSize.x;

          if (finalDensity > 0) {
            newBlocks[index] := 1; // Solid block
            foundSolidBlock := true;
          } else if (globalY <= Float.fromInt(Const.SEA_LEVEL)) {
            newBlocks[index] := 2; // Water block
          };
        };
      };
    };

    Debug.print("Blocks generated for chunk at position: " # debug_show (chunkPos));
    Array.freeze(newBlocks);
  };
};
