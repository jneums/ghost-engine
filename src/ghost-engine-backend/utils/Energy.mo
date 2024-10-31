import ECS "mo:geecs";
import Principal "mo:base/Principal";
import Float "mo:base/Float";
import Tokens "Tokens";
import Components "../components";
import Blocks "Blocks";

module {
  public let EnergyCid = "6tzm6-miaaa-aaaai-q3lha-cai";

  public func getEnergyCostToken(ctx : ECS.Types.Context<Components.Component>) : ?Tokens.Token {

    switch (Blocks.getTypeByTokenCid(ctx, Principal.fromText(EnergyCid))) {
      case (?block) {
        switch (Blocks.getTokenByBlockType(ctx, block)) {
          case (?token) {
            // Energy cost is token.density base units
            let energyCost = Tokens.toBaseUnit(token.density, token.decimals);
            ?Tokens.getTokenWithAmount(token, energyCost);
          };
          case (_) { null };
        };
      };
      case (_) { null };
    };
  };

  // Utility function to calculate the current power level of a unit
  public func getCurrentPowerLevel(ctx : ECS.Types.Context<Components.Component>, fungible : Components.FungibleComponent) : Float {
    switch (Blocks.getTypeByTokenCid(ctx, Principal.fromText(EnergyCid))) {
      case (?block) {
        switch (Blocks.getTokenByBlockType(ctx, block)) {
          case (?token) {
            switch (Tokens.findToken(fungible.tokens, token)) {
              case (?energyToken) {
                Float.sqrt(Tokens.fromBaseUnit(energyToken.amount, energyToken.decimals));
              };
              case (_) { 0 };
            };
          };
          case (_) { 0 };
        };
      };
      case (_) { 0 };
    };
  };
};
