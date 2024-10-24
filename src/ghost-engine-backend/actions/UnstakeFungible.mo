import T "Types";
import Components "../components";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import World "mo:geecs/World";

module {
  public type Args = {
    entityId : Nat;
    to : Principal;
    token : Principal;
    amount : Nat;
  };

  func handle(ctx : T.Context<Components.Component>, args : Args) {
    Debug.print("\nBegin unstaking tokens: " # Principal.toText(args.to));
    let unstakeFungible = #UnstakeFungibleComponent({
      to = args.to;
      tokenCid = args.token;
      amount = args.amount;
      startAt = Time.now();
      duration = 0;
    });
    World.addComponent(ctx, args.entityId, "UnstakeFungibleComponent", unstakeFungible);
  };

  public let Handler : T.ActionHandler<T.Context<Components.Component>, Args> = {
    handle = handle;
  };
};
