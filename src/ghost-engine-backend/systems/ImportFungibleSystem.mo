import ECS "mo:geecs";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Components "../components";
import ICRC2 "mo:icrc2-types";
import Tokens "../utils/Tokens";
import Blocks "../utils/Blocks";

module {
  // Define the PartialMetadata type
  type PartialMetadata = {
    logo : Text;
    name : Text;
    symbol : Text;
    decimals : Nat;
    fee : Nat;
  };

  // Private function to import fungible tokens
  private func getMetadata(importFungible : Components.ImportFungibleComponent) : async PartialMetadata {
    let icrc = actor (Principal.toText(importFungible.tokenCid)) : ICRC2.Service;

    // Fetch the metadata
    let res = await icrc.icrc1_metadata();

    // Helper function to extract a text value from the metadata
    func getTextValue(key : Text) : ?Text {
      switch (Array.find(res, func(entry : (Text, ICRC2.Value)) : Bool { entry.0 == key })) {
        case (?(_, #Text(value))) { ?value };
        case (_) { null };
      };
    };

    // Helper function to extract a nat value from the metadata
    func getNatValue(key : Text) : ?Nat {
      switch (Array.find(res, func(entry : (Text, ICRC2.Value)) : Bool { entry.0 == key })) {
        case (?(_, #Nat(value))) { ?value };
        case (_) { null };
      };
    };

    // Extract metadata fields
    let logo = Option.get(getTextValue("icrc1:logo"), "");
    let name = Option.get(getTextValue("icrc1:name"), "");
    let symbol = Option.get(getTextValue("icrc1:symbol"), "");
    let decimals = Option.get(getNatValue("icrc1:decimals"), 0);
    let fee = Option.get(getNatValue("icrc1:fee"), 0);

    // Return the parsed metadata
    {
      logo = logo;
      name = name;
      symbol = symbol;
      decimals = decimals;
      fee = fee;
    };
  };

  // Private function to handle token redemption
  private func handleTokenImport(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, importFungible : Components.ImportFungibleComponent, fungible : Components.FungibleComponent) : async () {
    // Import the fungible token by getting its metadata
    let metadata = await getMetadata(importFungible);

    let block = {
      name = metadata.name;
      dropInfo = {
        minQuantity = 1;
        maxQuantity = 1;
        token = {
          amount = Tokens.toBaseUnit(1, metadata.decimals);
          decimals = metadata.decimals;
          cid = Principal.toText(importFungible.tokenCid);
          logo = metadata.logo;
          symbol = metadata.symbol;
          name = metadata.name;
          fee = metadata.fee;
          density = 1;
        };
      };
    };

    // Register the new block type
    Blocks.registerToken(ctx, block, Tokens.Offset.userCreated);

    // Create the new empty token
    let emptyToken = Tokens.getTokenWithAmount(block.dropInfo.token, 0);

    // Save the new token to the wallet
    let merged = Tokens.mergeTokens(fungible.tokens, [emptyToken]);

    // Update the fungible component
    ECS.World.updateComponent(
      ctx,
      entityId,
      "FungibleComponent",
      #FungibleComponent({
        tokens = merged;
      }),
    );
    // Remove the importFungible tokens component
    ECS.World.removeComponent(ctx, entityId, "ImportFungibleComponent");
  };

  func update(ctx : ECS.Types.Context<Components.Component>, entityId : ECS.Types.EntityId, _deltaTime : Time.Time) : async () {
    switch (
      ECS.World.getComponent(ctx, entityId, "ImportFungibleComponent"),
      ECS.World.getComponent(ctx, entityId, "FungibleComponent"),
    ) {
      case (
        ? #ImportFungibleComponent(importFungibleFungible),
        ? #FungibleComponent(fungible),
      ) {
        await handleTokenImport(ctx, entityId, importFungibleFungible, fungible);
      };
      case (_) {};
    };
  };

  public let ImportFungibleSystem : ECS.Types.System<Components.Component> = {
    systemType = "ImportFungibleSystem";
    archetype = ["ImportFungibleComponent", "FungibleComponent"];
    update = update;
  };
};
