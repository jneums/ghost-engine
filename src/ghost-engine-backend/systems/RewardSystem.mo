import ECS "mo:geecs";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Components "../components";
import ICRC2 "mo:icrc2-types";
import env "../env";

module {
  let icrc1 = actor (env.CANISTER_ID_ICRC1_LEDGER_CANISTER) : ICRC2.Service;

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "RedeemTokensComponent"),
      ECS.World.getComponent(ctx, entityId, "FungibleComponent"),
    ) {
      case (
        ? #RedeemTokensComponent(redeem),
        ? #FungibleComponent(fungible),
      ) {
        // Check if the required amount of tokens is available in fungible
        if (Array.size(fungible.tokens) <= 0) {
          ECS.World.removeComponent(ctx, entityId, "RedeemTokensComponent");
          return;
        };

        // Check if the required duration has passed
        if (Time.now() - redeem.startAt < redeem.duration) {
          Debug.print("\nRedeem duration not yet reached");
          return;
        };

        for (token in Array.vals(fungible.tokens)) {
          Debug.print("\nRedeeming token: " # debug_show (token));
          // Transfer the tokens to the player
          let res = await icrc1.icrc1_transfer({
            from = env.CANISTER_ID_GHOST_ENGINE_BACKEND;
            to = {
              owner = redeem.to;
              subaccount = null;
            };
            amount = token.amount;
            memo = null;
            created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
            from_subaccount = null;
            fee = null;
          });

          switch (res) {
            case (#Ok(_)) {
              // Update the entity's fungible
              let newCargo = #FungibleComponent({
                tokens = Array.filter(fungible.tokens, func(t : { amount : Nat; cid : Principal; symbol : Text }) : Bool { not Principal.equal(t.cid, token.cid) });
              });
              ECS.World.addComponent(ctx, entityId, "FungibleComponent", newCargo);

            };
            case (#Err(err)) {
              Debug.print("\nError transferring tokens: " # debug_show (err));
            };
          };
        };

        // Remove the redeem tokens component
        ECS.World.removeComponent(ctx, entityId, "RedeemTokensComponent");
      };
      case (_) {};
    };
  };

  public let RewardSystem : ECS.Types.System<Components.Component> = {
    systemType = "RewardSystem";
    archetype = ["RedeemTokensComponent", "FungibleComponent"];
    update = update;
  };
};
