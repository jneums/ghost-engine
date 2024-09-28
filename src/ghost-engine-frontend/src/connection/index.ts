import IcWebSocket, { createWsConfig } from 'ic-websocket-js';
import { _WS_CANISTER_SERVICE } from 'ic-websocket-js/lib/cjs/idl';
import { match, P } from 'ts-pattern';
import {
  ghost_engine_backend,
  canisterId,
} from '../declarations/ghost-engine-backend';
import {
  _SERVICE,
  Action,
} from '../declarations/ghost-engine-backend/ghost-engine-backend.did';
import { ComponentConstructors, createComponentClass } from '../components';
import { SignIdentity } from '@dfinity/agent';
import { World } from '../world';

const IC_URL = import.meta.env.VITE_IC_URL as string;
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL as string;

export class Connection {
  private ws: IcWebSocket<typeof ghost_engine_backend> | null = null;
  public isConnected = false;

  public send(message: Action) {
    if (this.ws) {
      this.ws.send(message);
    }
  }

  public initialize(identity: SignIdentity, world: World) {
    const wsConfig = createWsConfig({
      canisterId,
      canisterActor: ghost_engine_backend,
      identity: identity,
      networkUrl: IC_URL,
    });

    this.ws = new IcWebSocket(GATEWAY_URL, undefined, wsConfig);

    console.log('Connecting to the canister: ', canisterId);

    this.ws.onopen = () => {
      console.log('Connected to the canister');
      this.isConnected = true;
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
                world.addComponent(Number(action.entityId), component);
              })
              .with({ Delete: P.select() }, (action) => {
                const constructor = ComponentConstructors[action.componentType];
                world.removeComponent(Number(action.entityId), constructor);
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
      this.isConnected = false;
    };

    this.ws.onerror = (error) => {
      console.log('Error:', error);
    };
  }
}
