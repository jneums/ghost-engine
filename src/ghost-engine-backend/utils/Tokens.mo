import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Map "mo:stable-hash-map/Map/Map";

module {
  public func toE8s(value : Nat) : Nat {
    value * 100_000_000;
  };

  public type Token = {
    symbol : Text;
    cid : Principal;
    amount : Nat;
  };

  // Helper function to merge tokens
  public func mergeTokens(tokens1 : [Token], tokens2 : [Token]) : [Token] {
    var tokenMap = Map.new<Text, Token>(Map.thash);

    // Add tokens from the first array to the map
    for (token in tokens1.vals()) {
      let key = token.symbol # "-" # Principal.toText(token.cid);
      Map.set(tokenMap, Map.thash, key, token);
    };

    // Add tokens from the second array to the map, merging amounts if necessary
    for (token in tokens2.vals()) {
      let key = token.symbol # "-" # Principal.toText(token.cid);
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
