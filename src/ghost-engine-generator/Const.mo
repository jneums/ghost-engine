module {
  // Environment
  public let SEA_LEVEL = 42;

  // Define the Land type as a variant to represent different terrain types
  public let Land = {
    Continentalness = 0;
    Erosion = 1;
    PeaksAndValleys = 2;
  };

  public let Climate = {
    Temperature = 0;
    Humidity = 1;
    Continentalness = 2;
    Erosion = 3;
    PeaksAndValleys = 4;
    Weirdness = 5;
  };

  public let BlockType = {
    Air = 0 : Nat16;
    Stone = 1 : Nat16;
    Water = 2 : Nat16;
    Dirt = 3 : Nat16;
    Bedrock = 4 : Nat16;
    Grass = 5 : Nat16;
    Lava = 6 : Nat16;
    Sand = 7 : Nat16;
    Gravel = 8 : Nat16;
    GoldOre = 9 : Nat16;
    IronOre = 10 : Nat16;
    CoalOre = 11 : Nat16;
    Log = 12 : Nat16;
    Leaves = 13 : Nat16;
    Sandstone = 14 : Nat16;
    DeadBush = 15 : Nat16;
  };
};
