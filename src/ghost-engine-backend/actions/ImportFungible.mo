import T "Types";
import Components "../components";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import World "mo:geecs/World";

module {
  public type Args = {
    entityId : Nat;
    to : Principal;
    token : Principal;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nImporting fungible token: " # Principal.toText(args.token));
    let importFungible = #ImportFungibleComponent({
      to = args.to;
      tokenCid = args.token;
    });
    World.addComponent(ctx, args.entityId, "ImportFungibleComponent", importFungible);
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
