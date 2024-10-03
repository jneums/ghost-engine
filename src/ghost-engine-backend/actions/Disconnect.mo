import T "Types";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import ECS "mo:geecs";
import Player "../utils/Player";
import Const "../utils/Const";
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
        // Update the player's connection status
        ECS.World.addComponent(
          ctx,
          exists,
          "DisconnectComponent",
          #DisconnectComponent({
            startAt = Time.now();
            duration = Const.DISCONNECT_DURATION;
          }),
        );
      };
      case (null) {};
    };
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
