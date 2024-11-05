import Array "mo:base/Array";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Climate "Climate";
import Const "Const";
import Types "Types";
import Surface "Surface";

module {

  let SEED = 0 : Nat64;
  let chunkSize = { x = 16; y = 128; z = 16 };

  // Define the clamp function
  func clamp(value : Float, min : Float, max : Float) : Float {
    if (value < min) {
      return min;
    } else if (value > max) {
      return max;
    } else {
      return value;
    };
  };

  public func generate(chunkPos : Types.ChunkPosition) : [Nat16] {
    let blockCount = chunkSize.x * chunkSize.y * chunkSize.z;
    var newBlocks = Array.init<Nat16>(blockCount, 0 : Nat16);
    let climate = Climate.initClimateSeed(SEED);
    let baseOffset = Float.fromInt(Const.SEA_LEVEL);
    let maxHeight = chunkSize.y;

    Debug.print("Generating and replacing blocks for chunk at position: " # debug_show (chunkPos));
    for (z in Iter.range(0, chunkSize.z - 1)) {
      let globalZ = Float.fromInt(z + chunkPos.z * chunkSize.z);
      for (x in Iter.range(0, chunkSize.x - 1)) {
        let globalX = Float.fromInt(x + chunkPos.x * chunkSize.x);

        // Sample 2D noise for continentalness, erosion, and peaks and valleys
        let continentalness = Climate.sampleClimateNoise(climate, Const.Climate.Continentalness, globalX, 0, globalZ);
        let erosion = Climate.sampleClimateNoise(climate, Const.Climate.Erosion, globalX, 0, globalZ);
        let peaksAndValleys = Climate.sampleClimateNoise(climate, Const.Climate.PeaksAndValleys, globalX, 0, globalZ);

        // Calculate the height using a combination of noise values
        let heightOffset = peaksAndValleys + continentalness;
        let verticalStretch = -erosion;

        // Calculate the final height
        var highestY = (heightOffset * verticalStretch) * (Float.fromInt(maxHeight) - baseOffset) + baseOffset;

        // Use the custom clamp function
        highestY := clamp(highestY, 0.0, Float.fromInt(maxHeight));

        for (y in Iter.revRange(Float.toInt(highestY) - 1, 0)) {
          let natY = Int.abs(y); // Convert y to Nat for indexing
          let index = x + z * chunkSize.x + natY * chunkSize.z * chunkSize.x;
          newBlocks[index] := Const.BlockType.Stone;
        };

        // Replace surface blocks and add water
        label replaceSurface for (y in Iter.revRange(chunkSize.y - 1, 0)) {
          let index = x + z * chunkSize.x + Int.abs(y) * chunkSize.z * chunkSize.x;
          let blockAboveIndex = x + z * chunkSize.x + (Int.abs(y) + 1) * chunkSize.z * chunkSize.x;

          let blockAbove = if (Int.abs(y) + 1 < chunkSize.y) newBlocks[blockAboveIndex] else Const.BlockType.Air;

          let elevation = Int.abs(y);
          let depth = Int.abs(elevation - Float.toInt(highestY));
          let waterAbove = blockAbove == Const.BlockType.Water;
          let isFloor = blockAbove == Const.BlockType.Air or blockAbove == Const.BlockType.Water;
          let currentBlock = newBlocks[index];

          newBlocks[index] := Surface.getBlockType(currentBlock, elevation, depth, waterAbove, isFloor);
        };
      };
    };

    Debug.print("Blocks generated and replaced for chunk at position: " # debug_show (chunkPos));
    Array.freeze(newBlocks);
  };
};
