module {
  // Environment
  public let SEA_LEVEL = 48;

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
};
