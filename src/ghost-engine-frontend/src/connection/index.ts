import IcWebSocket, { IcWebSocketConfig } from 'ic-websocket-js';
import { _WS_CANISTER_SERVICE } from 'ic-websocket-js/lib/cjs/idl';
import { match, P } from 'ts-pattern';
import { ghost_engine_backend } from '../declarations/ghost-engine-backend';
import { _SERVICE } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';
import { ECSManager } from '../ecs';
import { getComponent } from '../components';

export class Connection {
  private ws: IcWebSocket<typeof ghost_engine_backend> | null = null;

  constructor(
    private gatewayUrl: string,
    private wsConfig: IcWebSocketConfig<_SERVICE>,
    private ecs: ECSManager,
  ) {}

  public initialize() {
    this.ws = new IcWebSocket(this.gatewayUrl, undefined, this.wsConfig);

    this.ws.onopen = () => {
      console.log('Connected to the canister');
    };

    // Handle component updates from the server
    this.ws.onmessage = async (event) => {
      console.log(event.data);
      match(event.data)
        .with({ Insert: P.select() }, (action) => {
          const component = getComponent(action.component.componentData);
          this.ecs.addComponent(action.entityId, component);
        })
        .with({ Delete: P.select() }, (action) => {
          this.ecs.removeComponent(action.entityId, action.componentType);
        })
        .otherwise(() => {
          console.log('Unknown message!');
        });
    };

    this.ws.onclose = () => {
      console.log('Disconnected from the canister');
    };

    this.ws.onerror = (error) => {
      // TODO: Reconnect on error
      console.log('Error:', error);
    };
  }
}
