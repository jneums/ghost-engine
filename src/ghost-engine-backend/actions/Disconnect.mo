import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import ECS "mo:geecs";
import Player "../utils/Player";
import Components "../components";

module {
  public type Args = {
    principal : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nPlayer disconnected: " # debug_show (args.principal));

    let entityId = Player.findPlayersEntityId(ctx, args.principal);
    // Remove the player from the simulation
    switch (entityId) {
      case (?exists) {
        ECS.World.removeComponent(ctx, exists, "PositionComponent");
      };
      case (null) {};
    };
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
