import Actions "../actions";
import T "Types";
import IcWebSocketCdk "mo:ic-websocket-cdk";
import Debug "mo:base/Debug";

module {
  public let Types = T;

  func send(ctx : T.Context, to : Principal, msg : Actions.Action) : async () {
    Debug.print("Sending message: " # debug_show (msg));

    // here we call the send from the CDK!!
    switch (await IcWebSocketCdk.send(ctx.wsState, to, to_candid (msg))) {
      case (#Err(err)) {
        Debug.print("Could not send message:" # debug_show (#Err(err)));
      };
      case (_) {};
    };
  };

  public let Client : T.MessageClient = {
    send = send;
  };
};
