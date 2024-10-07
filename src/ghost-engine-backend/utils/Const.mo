module {
  // Duration of logout time in nanoseconds
  public let DISCONNECT_DURATION = 5_000_000_000;

  // 5 minutes in nanoseconds
  public let MAX_AFK_BEFORE_DISCONNECT = 300_000_000_000;

  // Chunk size
  public let CHUNK_HEIGHT = 128; // Initial maximum y-value
  public let CHUNK_SIZE = 16; // Assuming a 16x16x16 chunk size for simplicity

  public let DEFAULT_VIEW_RADIUS = 32.0;
};
