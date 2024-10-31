module {
  // Duration of logout time in nanoseconds
  public let DISCONNECT_DURATION = 5_000_000_000;

  // 5 minutes in nanoseconds
  public let MAX_AFK_BEFORE_DISCONNECT = 300_000_000_000;

  // Chunks
  public let CHUNK_HEIGHT = 128; // Initial maximum y-value
  public let CHUNK_SIZE = 16; // Assuming a 16x16x16 chunk size for simplicity

  public let DEFAULT_VIEW_RADIUS = 64.0;

  // Environment
  public let SEA_LEVEL = 48;

  // Mining
  public let MINING_RADIUS = 5.0;
  public let PLACEMENT_RADIUS = 5.0;

  // Unit
  public let UNIT_VELOCITY = 3.0;

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

  public let SpawnPoint = {
    scale = {
      x = 1.0;
      y = 1.0;
      z = 1.0;
    };
    rotation = {
      x = 0.0;
      y = 1.0;
      z = 0.0;
      w = 0.0;
    };
    position = {
      x = -178.0;
      y = 50.0;
      z = 162.0;
    };
  };
};
