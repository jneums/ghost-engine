import Principal "mo:base/Principal";
import IcWebSocketCdkState "mo:ic-websocket-cdk/State";
import Actions "../actions";

module {
  public type Context = {
    wsState : IcWebSocketCdkState.IcWebSocketState;
  };

  public type MessageClient = {
    send : (Context, Principal, Actions.Action) -> async ();
  };
};
