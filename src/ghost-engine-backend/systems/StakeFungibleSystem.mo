import ECS "mo:geecs";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Components "../components";
import ICRC2 "mo:icrc2-types";
import Tokens "../utils/Tokens";
import env "../env";

module {

  // Private function to check if the stakeFungible duration has passed
  private func isStakeDurationPassed(stakeFungible : Components.StakeFungibleComponent) : Bool {
    Time.now() - stakeFungible.startAt >= stakeFungible.duration;
  };

  // Private function to stakeFungible tokens
  private func stakeFungibleTokens(stakeFungible : Components.StakeFungibleComponent, token : Tokens.Token) : async Bool {
    Debug.print("\nStaking token: " # debug_show (token));
    let icrc = actor (token.cid) : ICRC2.Service;
    let res = await icrc.icrc2_transfer_from({
      from = {
        owner = stakeFungible.from;
        subaccount = null;
      };
      to = {
        owner = Principal.fromText(env.CANISTER_ID_GHOST_ENGINE_BACKEND);
        subaccount = null;
      };
      spender_subaccount = null;
      amount = token.amount;
      memo = null;
      created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
      fee = null;
    });

    switch (res) {
      case (#Ok(_)) {
        true;
      };
      case (#Err(err)) {
        Debug.print("\nError staking tokens: " # debug_show (err));
        false;
      };
    };
  };

  // Private function to handle token redemption
  private func handleTokenStake(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, stakeFungibleFungible : Components.StakeFungibleComponent, fungible : Components.FungibleComponent) : async () {
    if (Array.size(fungible.tokens) <= 0) {
      ECS.World.removeComponent(ctx, entityId, "StakeFungibleComponent");
      return;
    };

    if (not isStakeDurationPassed(stakeFungibleFungible)) {
      Debug.print("\nStake duration not yet reached");
      return;
    };

    label stakeFungibleToken for (token in Array.vals(fungible.tokens)) {
      let isToken = token.cid == Principal.toText(stakeFungibleFungible.tokenCid);
      if (not isToken) {
        continue stakeFungibleToken;
      };
      // Token to transact
      let tokenWithAmount = Tokens.getTokenWithAmount(token, stakeFungibleFungible.amount);

      if (await stakeFungibleTokens(stakeFungibleFungible, tokenWithAmount)) {
        let fungibleComponent = #FungibleComponent({
          tokens = Tokens.mergeTokens(fungible.tokens, [tokenWithAmount]);
        });
        ECS.World.addComponent(ctx, entityId, "FungibleComponent", fungibleComponent);
      };
      break stakeFungibleToken;
    };

    // Remove the stakeFungible tokens component
    ECS.World.removeComponent(ctx, entityId, "StakeFungibleComponent");
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "StakeFungibleComponent"),
      ECS.World.getComponent(ctx, entityId, "FungibleComponent"),
    ) {
      case (
        ? #StakeFungibleComponent(stakeFungibleFungible),
        ? #FungibleComponent(fungible),
      ) {
        await handleTokenStake(ctx, entityId, stakeFungibleFungible, fungible);
      };
      case (_) {};
    };
  };

  public let StakeFungibleSystem : ECS.Types.System<Components.Component> = {
    systemType = "StakeFungibleSystem";
    archetype = ["StakeFungibleComponent", "FungibleComponent"];
    update = update;
  };
};
