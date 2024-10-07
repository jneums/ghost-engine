import Const "../utils/Const";
import Vector3 "../math/Vector3";
import Float "mo:base/Float";
module {
  // Function to calculate the chunk position from a Vector3 position
  public func getChunkPosition(position : Vector3.Vector3) : Vector3.Vector3 {
    let floatChunkSize = Float.fromInt(Const.CHUNK_SIZE);
    Vector3.floor({
      x = position.x / floatChunkSize;
      y = 0.0;
      z = position.z / floatChunkSize;
    });
  };

  // Calculate the world position of a block within a chunk
  public func getBlockPosition(chunkPos : Vector3.Vector3, blockIndex : Int) : Vector3.Vector3 {
    let x = blockIndex % Const.CHUNK_SIZE;
    let y = (blockIndex / Const.CHUNK_SIZE) % Const.CHUNK_HEIGHT; // Use CHUNK_HEIGHT for y
    let z = blockIndex / (Const.CHUNK_SIZE * Const.CHUNK_HEIGHT); // Use CHUNK_HEIGHT here as well
    return {
      x = chunkPos.x + Float.fromInt(x);
      y = chunkPos.y + Float.fromInt(y);
      z = chunkPos.z + Float.fromInt(z);
    };
  };

  // Get the block type at a specific position within a chunk
  public func getBlockType(blocks : [Nat8], x : Nat, y : Nat, z : Nat) : Nat8 {
    let index = x + y * Const.CHUNK_SIZE + z * Const.CHUNK_SIZE * Const.CHUNK_HEIGHT; // Use CHUNK_HEIGHT for y
    return blocks[index];
  };

  // Set the block type at a specific position within a chunk
  public func setBlockType(blocks : [var Nat8], x : Nat, y : Nat, z : Nat, blockType : Nat8) {
    let index = x + y * Const.CHUNK_SIZE + z * Const.CHUNK_SIZE * Const.CHUNK_HEIGHT; // Use CHUNK_HEIGHT for y
    blocks[index] := blockType;
  };
};
