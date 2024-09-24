import IcWebSocket, { IcWebSocketConfig } from 'ic-websocket-js';
import { _WS_CANISTER_SERVICE } from 'ic-websocket-js/lib/cjs/idl';
import { match, P } from 'ts-pattern';
import { ghost_engine_backend } from '../declarations/ghost-engine-backend';
import {
  _SERVICE,
  Action,
} from '../declarations/ghost-engine-backend/ghost-engine-backend.did';
import { World } from '../ecs';
import { createComponentClass } from '../components';

export class Connection {
  private ws: IcWebSocket<typeof ghost_engine_backend> | null = null;

  constructor(private gatewayUrl: string, private ecs: World) {}

  public send(message: Action) {
    if (this.ws) {
      this.ws.send(message);
    }
  }

  public initialize(config: IcWebSocketConfig<_SERVICE>) {
    this.ws = new IcWebSocket(this.gatewayUrl, undefined, config);

    this.ws.onopen = () => {
      console.log('Connected to the canister');
    };

    // Handle component updates from the server
    this.ws.onmessage = async (event) => {
      console.log(event.data);
      match(event.data)
        .with({ Updates: P.select() }, (actions) => {
          actions.forEach((action) => {
            match(action)
              .with({ Insert: P.select() }, (action) => {
                const component = createComponentClass(action.component);
                this.ecs.addComponent(Number(action.entityId), component);
              })
              .with({ Delete: P.select() }, (action) => {
                this.ecs.removeComponent(
                  Number(action.entityId),
                  action.componentType,
                );
              })
              .otherwise(() => {
                console.log('Message is not Insert or Delete!');
              });
          });
        })
        .otherwise(() => {
          console.log('Message is not a component update!');
        });
    };

    this.ws.onclose = () => {
      console.log('Disconnected from the canister');
    };

    this.ws.onerror = (error) => {
      // TODO: Figure out why we're getting the [Ack] error
      // [onAckMessageTimeout] Ack message timeout. Not received ack for sequence numbers: (4) [1n, 2n, 3n, 4n]
      this.initialize(config);
      console.log('Error:', error);
    };
  }
}
