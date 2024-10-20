import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Map "mo:stable-hash-map/Map/Map";

module {
  public func toE8s(value : Nat) : Nat {
    value * 100_000_000;
  };

  public type Token = {
    symbol : Text;
    cid : Text;
    amount : Nat;
    blockType : Nat8;
  };

  public let Air = {
    symbol = "Air";
    cid = "aaaaa-aa";
    amount = 0;
    blockType = 0 : Nat8;
  };

  public let Stone = {
    symbol = "Stone";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cai";
    amount = 100_000_000;
    blockType = 1 : Nat8;
  };

  public let Blocks = [
    Air, // 0
    Stone, // 1
  ];

  public func getTokenByBlockType(blockType : Nat8) : Token {
    switch (blockType) {
      case (1) { Stone };
      case (_) { Air };
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
        if (existingToken.amount > token.amount) {
          // Reduce the amount of the token
          Map.set(
            tokenMap,
            Map.thash,
            key,
            {
              symbol = existingToken.symbol;
              cid = existingToken.cid;
              amount = existingToken.amount - token.amount : Nat;
              blockType = existingToken.blockType;
            },
          );
        } else {
          // Remove the token if the amount is zero or less
          Map.delete(tokenMap, Map.thash, key);
        };
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

    // Add tokens from the second array to the map, merging amounts if necessary
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
              cid = token.cid;
              amount = existingToken.amount + token.amount;
              blockType = token.blockType;
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
};
