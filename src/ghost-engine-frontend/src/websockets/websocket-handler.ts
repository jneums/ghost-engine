import IcWebSocket, { IcWebSocketConfig } from 'ic-websocket-js';
import { ghost_engine_backend } from '../declarations/ghost-engine-backend';
import { _WS_CANISTER_SERVICE } from 'ic-websocket-js/lib/cjs/idl';
import { _SERVICE } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';

export class WebSocketHandler {
  private ws: IcWebSocket<typeof ghost_engine_backend> | null = null;

  constructor(
    private gatewayUrl: string,
    private wsConfig: IcWebSocketConfig<_SERVICE>,
  ) {}

  public connect() {
    this.ws = new IcWebSocket(this.gatewayUrl, undefined, this.wsConfig);

    this.ws.onopen = () => {
      console.log('Connected to the canister');
    };

    this.ws.onmessage = async (event) => {
      console.log('Received message:', event.data.message);

      const messageToSend = {
        message: 'pong',
      };
      this.ws?.send(messageToSend);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from the canister');
    };

    this.ws.onerror = (error) => {
      console.log('Error:', error);
    };
  }
}
