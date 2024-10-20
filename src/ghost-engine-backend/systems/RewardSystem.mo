import ECS "mo:geecs";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Components "../components";
import ICRC2 "mo:icrc2-types";
import env "../env";
import Tokens "../utils/Tokens";

module {

  // Private function to check if the redeem duration has passed
  private func isRedeemDurationPassed(redeem : Components.RedeemTokensComponent) : Bool {
    Time.now() - redeem.startAt >= redeem.duration;
  };

  // Private function to transfer tokens
  private func transferTokens(redeem : Components.RedeemTokensComponent, token : Tokens.Token) : async Bool {
    Debug.print("\nRedeeming token: " # debug_show (token));
    let icrc1 = actor (token.cid) : ICRC2.Service;
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
        true;
      };
      case (#Err(err)) {
        Debug.print("\nError transferring tokens: " # debug_show (err));
        false;
      };
    };
  };

  // Private function to handle token redemption
  private func handleTokenRedemption(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, redeem : Components.RedeemTokensComponent, fungible : Components.FungibleComponent) : async () {
    if (Array.size(fungible.tokens) <= 0) {
      ECS.World.removeComponent(ctx, entityId, "RedeemTokensComponent");
      return;
    };

    if (not isRedeemDurationPassed(redeem)) {
      Debug.print("\nRedeem duration not yet reached");
      return;
    };

    for (token in Array.vals(fungible.tokens)) {
      if (await transferTokens(redeem, token)) {
        // Update the entity's fungible
        let newCargo = #FungibleComponent({
          tokens = Array.filter(fungible.tokens, func(t : Tokens.Token) : Bool { t.cid != token.cid });
        });
        ECS.World.addComponent(ctx, entityId, "FungibleComponent", newCargo);
      };
    };

    // Remove the redeem tokens component
    ECS.World.removeComponent(ctx, entityId, "RedeemTokensComponent");
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "RedeemTokensComponent"),
      ECS.World.getComponent(ctx, entityId, "FungibleComponent"),
    ) {
      case (
        ? #RedeemTokensComponent(redeem),
        ? #FungibleComponent(fungible),
      ) {
        await handleTokenRedemption(ctx, entityId, redeem, fungible);
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
