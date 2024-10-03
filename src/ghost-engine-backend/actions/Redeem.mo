import T "Types";
import Components "../components";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import World "mo:geecs/World";

module {
  public type Args = {
    to : Principal;
    entityId : Nat;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nBegin redeeming tokens: " # Principal.toText(args.to));
    let redeem = #RedeemTokensComponent({
      to = args.to;
      startAt = Time.now();
      duration = 0;
    });
    World.addComponent(ctx, args.entityId, "RedeemTokensComponent", redeem);
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
