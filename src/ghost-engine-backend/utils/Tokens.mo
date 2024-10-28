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
    { token with amount = amount };
  };

  public func hasToken(tokens : [Token], token : Token) : Bool {
    Option.isSome(findToken(tokens, token));
  };

  public func removeToken(tokens : [Token], token : Token) : [Token] {
    let tokenMap = createTokenMap(tokens);
    let key = createTokenKey(token);
    switch (Map.get(tokenMap, Map.thash, key)) {
      case (?existingToken) {
        let newAmount = calculateNewAmount(existingToken.amount, token.amount);
        updateTokenAmount(tokenMap, key, existingToken, newAmount);
      };
      case (null) {};
    };
    convertMapToArray(tokenMap);
  };

  public func mergeTokens(tokens1 : [Token], tokens2 : [Token]) : [Token] {
    let tokenMap = createTokenMap(tokens1);
    mergeTokenArrays(tokenMap, tokens2);
    convertMapToArray(tokenMap);
  };

  public func toBaseUnit(value : Nat, decimals : Nat) : Nat {
    value * Nat.pow(10, decimals);
  };

  public func fromBaseUnit(value : Nat, decimals : Nat) : Float {
    Float.fromInt(value) / Float.fromInt(Nat.pow(10, decimals));
  };

  private func findToken(tokens : [Token], token : Token) : ?Token {
    Array.find(
      tokens,
      func(t : Token) : Bool {
        t.symbol == token.symbol and t.cid == token.cid and t.amount >= token.amount
      },
    );
  };

  private func createTokenMap(tokens : [Token]) : Map.Map<Text, Token> {
    var tokenMap = Map.new<Text, Token>(Map.thash);
    for (t in tokens.vals()) {
      let key = createTokenKey(t);
      Map.set(tokenMap, Map.thash, key, t);
    };
    tokenMap;
  };

  private func createTokenKey(token : Token) : Text {
    token.symbol # "-" # token.cid;
  };

  private func calculateNewAmount(existingAmount : Nat, removeAmount : Nat) : Nat {
    if (existingAmount > removeAmount) {
      existingAmount - removeAmount;
    } else {
      0;
    };
  };

  private func updateTokenAmount(tokenMap : Map.Map<Text, Token>, key : Text, existingToken : Token, newAmount : Nat) {
    Map.set(
      tokenMap,
      Map.thash,
      key,
      { existingToken with amount = newAmount },
    );
  };

  private func convertMapToArray(tokenMap : Map.Map<Text, Token>) : [Token] {
    Iter.toArray(Map.vals(tokenMap));
  };

  private func mergeTokenArrays(tokenMap : Map.Map<Text, Token>, tokens : [Token]) {
    for (token in tokens.vals()) {
      let key = createTokenKey(token);
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
  };
};
