import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Float "mo:base/Float";
import Map "mo:stable-hash-map/Map/Map";

module {

  public type Token = {
    symbol : Text;
    name : Text;
    cid : Text;
    amount : Nat;
    decimals : Nat;
    logo : Text;
    fee : Nat;
  };

  public let Offset = {
    generated = 0 : Nat8; // The first 1000 tokens are reserved for generated tokens
    userCreated = 1 : Nat8; // The next 1000 tokens are reserved for user-created tokens
  };

  public func getTokenWithAmount(token : Token, amount : Nat) : Token {
    {
      symbol = token.symbol;
      name = token.name;
      cid = token.cid;
      amount = amount;
      decimals = token.decimals;
      logo = token.logo;
      fee = token.fee;
    };
  };

  public func hasToken(tokens : [Token], token : Token) : Bool {
    // Check if the token is in the array
    // and the value is greater than or equal to the required amount
    Option.isSome(Array.find(tokens, func(t : Token) : Bool { t.symbol == token.symbol and t.cid == token.cid and t.amount >= token.amount }));
  };

  public func removeToken(tokens : [Token], token : Token) : [Token] {
    // Create a map to track tokens
    var tokenMap = Map.new<Text, Token>(Map.thash);

    // Add tokens from the array to the map
    for (t in tokens.vals()) {
      let key = t.symbol # "-" # t.cid;
      Map.set(tokenMap, Map.thash, key, t);
    };

    // Find the token to remove
    let key = token.symbol # "-" # token.cid;
    switch (Map.get(tokenMap, Map.thash, key)) {
      case (?existingToken) {
        // Update the amount of the token
        let newAmount = if (existingToken.amount > token.amount) {
          // Subtract the amount from the token
          existingToken.amount - token.amount : Nat;
        } else {
          // Set the amount to 0
          0;
        };

        Map.set(
          tokenMap,
          Map.thash,
          key,
          {
            symbol = existingToken.symbol;
            name = existingToken.name;
            cid = existingToken.cid;
            decimals = existingToken.decimals;
            amount = newAmount;
            logo = existingToken.logo;
            fee = existingToken.fee;
          },
        );
      };
      case (null) {
        // Token not found, do nothing
      };
    };

    // Convert the map back to an array
    Iter.toArray(Map.vals(tokenMap));
  };

  // Helper function to merge tokens
  public func mergeTokens(tokens1 : [Token], tokens2 : [Token]) : [Token] {
    var tokenMap = Map.new<Text, Token>(Map.thash);

    // Add tokens from the first array to the map
    for (token in tokens1.vals()) {
      let key = token.symbol # "-" # token.cid;
      Map.set(tokenMap, Map.thash, key, token);
    };

    // Add tokens from the second array to the map, merging decimalss if necessary
    for (token in tokens2.vals()) {
      let key = token.symbol # "-" # token.cid;
      switch (Map.get(tokenMap, Map.thash, key)) {
        case (?existingToken) {
          Map.set(
            tokenMap,
            Map.thash,
            key,
            {
              symbol = token.symbol;
              name = token.name;
              cid = token.cid;
              decimals = existingToken.decimals;
              amount = existingToken.amount + token.amount;
              logo = token.logo;
              fee = token.fee;
            },
          );
        };
        case (null) {
          Map.set(tokenMap, Map.thash, key, token);
        };
      };
    };

    // Convert the map back to an array
    Iter.toArray(Map.vals(tokenMap));
  };

  /**
   * Convert a value to the base unit used for processing, given the number of decimals.
   * @param value Nat
   * @param decimals number of decimal places
   * @returns value in the smallest unit as a Nat
   */
  public func toBaseUnit(value : Nat, decimals : Nat) : Nat {
    value * Nat.pow(10, decimals);
  };

  /**
   * Convert a value from the base unit back to the original unit, given the number of decimals.
   * @param value Nat
   * @param decimals number of decimal places
   * @returns value as a Float
   */
  public func fromBaseUnit(value : Nat, decimals : Nat) : Float {
    Float.fromInt(value) / Float.fromInt(Nat.pow(10, decimals));
  };
};
