import ECS "mo:geecs";
import Debug "mo:base/Debug";
import T "Types";
import Move "Move";
import Connect "Connect";
import Disconnect "Disconnect";
import Attack "Attack";
import Respawn "Respawn";
import ImportFungible "ImportFungible";
import StakeFungible "StakeFungible";
import UnstakeFungible "UnstakeFungible";
import Mine "Mine";
import PlaceBlock "PlaceBlock";
import Components "../components";

module {
  public let Types = T;

  public type Action = {
    // Action type for sending update to the clients
    #Updates : [ECS.Types.Update<Components.Component>];

    // Add additional action types here
    #Connect : Connect.Args;
    #Disconnect : Disconnect.Args;
    #Move : Move.Args;
    #Mine : Mine.Args;
    #PlaceBlock : PlaceBlock.Args;
    #Attack : Attack.Args;
    #Respawn : Respawn.Args;
    #ImportFungible : ImportFungible.Args;
    #StakeFungible : StakeFungible.Args;
    #UnstakeFungible : UnstakeFungible.Args;
  };

  // Add action handler functions here
  public func handleAction(ctx : T.Context<Components.Component>, action : Action) {
    switch (action) {
      case (#Connect(args)) {
        Connect.Handler.handle(ctx, args);
      };
      case (#Disconnect(args)) {
        Disconnect.Handler.handle(ctx, args);
      };
      case (#Move(args)) {
        Move.Handler.handle(ctx, args);
      };
      case (#Mine(args)) {
        Mine.Handler.handle(ctx, args);
      };
      case (#PlaceBlock(args)) {
        PlaceBlock.Handler.handle(ctx, args);
      };
      case (#Attack(args)) {
        Attack.Handler.handle(ctx, args);
      };
      case (#Respawn(args)) {
        Respawn.Handler.handle(ctx, args);
      };
      case (#ImportFungible(args)) {
        ImportFungible.Handler.handle(ctx, args);
      };
      case (#StakeFungible(args)) {
        StakeFungible.Handler.handle(ctx, args);
      };
      case (#UnstakeFungible(args)) {
        UnstakeFungible.Handler.handle(ctx, args);
      };
      case (#Updates(_)) {
        Debug.print("These actions are sent to the clients...");
      };
    };
  };
};
