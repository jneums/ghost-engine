import Const "Const";

module {
  public func getBlockType(currentBlock : Nat16, elevation : Nat, depth : Nat, waterAbove : Bool, isFloor : Bool) : Nat16 {
    if (currentBlock == Const.BlockType.Air and elevation <= Const.SEA_LEVEL) {
      return Const.BlockType.Water;
    };

    if (currentBlock == Const.BlockType.Air) {
      return Const.BlockType.Air;
    };

    if (elevation < 4) {
      return Const.BlockType.Bedrock;
    };

    if (elevation > (Const.SEA_LEVEL - 6 : Nat) and elevation < Const.SEA_LEVEL + 1 and isFloor) {
      return Const.BlockType.Sand;
    };

    if (elevation < (Const.SEA_LEVEL - 6 : Nat) and isFloor and waterAbove) {
      return Const.BlockType.Gravel;
    };

    if (isFloor and not waterAbove) {
      return Const.BlockType.Grass;
    };

    if (depth < 3) {
      return Const.BlockType.Dirt;
    };

    currentBlock;
  };
};
