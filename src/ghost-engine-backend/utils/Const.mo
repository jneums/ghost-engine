module {
  // Duration of logout time in nanoseconds
  public let DISCONNECT_DURATION = 5_000_000_000;

  // 5 minutes in nanoseconds
  public let MAX_AFK_BEFORE_DISCONNECT = 300_000_000_000;

  // Chunks
  public let CHUNK_HEIGHT = 128;
  public let CHUNK_SIZE = 16;

  public let DEFAULT_VIEW_RADIUS = 64.0;

  // Mining
  public let MINING_RADIUS = 5.0;
  public let PLACEMENT_RADIUS = 5.0;

  // Unit
  public let UNIT_VELOCITY = 3.0;

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
      x = 248.0;
      y = 44.0;
      z = 93.0;
    };
  };
};
