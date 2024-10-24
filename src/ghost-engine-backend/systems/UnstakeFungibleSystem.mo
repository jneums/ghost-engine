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

  // Private function to check if the transfer duration has passed
  private func isTransferDurationPassed(transfer : Components.UnstakeFungibleComponent) : Bool {
    Time.now() - transfer.startAt >= transfer.duration;
  };

  // Private function to transfer tokens
  private func unstakeTokens(transfer : Components.UnstakeFungibleComponent, token : Tokens.Token) : async Bool {
    Debug.print("\nUnstaking token: " # debug_show (token));
    let icrc1 = actor (token.cid) : ICRC2.Service;
    let res = await icrc1.icrc1_transfer({
      from = Principal.fromText(env.CANISTER_ID_GHOST_ENGINE_BACKEND);
      to = {
        owner = transfer.to;
        subaccount = null;
      };
      amount = token.amount - token.fee;
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
  private func handleUnstakeFungible(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, transferFungible : Components.UnstakeFungibleComponent, fungible : Components.FungibleComponent) : async () {
    if (Array.size(fungible.tokens) <= 0) {
      ECS.World.removeComponent(ctx, entityId, "UnstakeFungibleComponent");
      return;
    };

    if (not isTransferDurationPassed(transferFungible)) {
      Debug.print("\nTransfer duration not yet reached");
      return;
    };

    label transferToken for (token in Array.vals(fungible.tokens)) {
      let isToken = token.cid == Principal.toText(transferFungible.tokenCid);
      if (not isToken) {
        continue transferToken;
      };
      // Token to transact
      let tokenWithAmount = Tokens.getTokenWithAmount(token, transferFungible.amount);

      if (await unstakeTokens(transferFungible, tokenWithAmount)) {
        let fungibleComponent = #FungibleComponent({
          tokens = Tokens.removeToken(fungible.tokens, tokenWithAmount);
        });
        ECS.World.addComponent(ctx, entityId, "FungibleComponent", fungibleComponent);
      };
      break transferToken;
    };

    // Remove the transfer tokens component
    ECS.World.removeComponent(ctx, entityId, "UnstakeFungibleComponent");
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "UnstakeFungibleComponent"),
      ECS.World.getComponent(ctx, entityId, "FungibleComponent"),
    ) {
      case (
        ? #UnstakeFungibleComponent(transferFungible),
        ? #FungibleComponent(fungible),
      ) {
        await handleUnstakeFungible(ctx, entityId, transferFungible, fungible);
      };
      case (_) {};
    };
  };

  public let UnstakeFungibleSystem : ECS.Types.System<Components.Component> = {
    systemType = "UnstakeFungibleSystem";
    archetype = ["UnstakeFungibleComponent", "FungibleComponent"];
    update = update;
  };
};
