import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Tokens "Tokens";
import Components "../components";
import TokenRegistry "TokenRegistry";

module {
  // Utility function to calculate the current power level of a unit
  public func getCurrentPowerLevel(fungible : Components.FungibleComponent) : Float {
    let token = TokenRegistry.Energy;
    switch (Tokens.findToken(fungible.tokens, token)) {
      case (?energyToken) {
        Debug.print("Energy token: " # debug_show (energyToken));
        Tokens.fromBaseUnit(energyToken.amount, energyToken.decimals);
      };
      case (_) {
        Debug.print("No energy token found");
        0;
      };
    };
  };
};
