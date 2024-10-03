import { canisterId, createActor } from '../declarations/ghost-engine-backend';
import {
  _SERVICE,
  Action,
  Update,
} from '../declarations/ghost-engine-backend/ghost-engine-backend.did';
import { ComponentConstructors, createComponentClass } from '../components';
import { World } from '../world';
import { match, P } from 'ts-pattern';
import { HttpAgent, Identity } from '@dfinity/agent';

export class Connection {
  private pollingInterval: number | null = null;
  private lastUpdate = 0n;
  private server: _SERVICE | null = null;

  public async send(message: Action) {
    if (!this.server) {
      throw new Error('Not connected to the canister');
    }
    // Implement the send logic if needed for polling
    await this.server.putAction(message);
  }

  public initialize(
    identity: Identity,
    world: World,
    setIsConnected: (isConnected: boolean) => void,
    setIsConnecting: (isConnecting: boolean) => void,
  ) {
    setIsConnecting(true);

    const host =
      process.env.DFX_NETWORK === 'local'
        ? 'http://127.0.0.1:4943'
        : 'https://icp-api.io';

    const agent = HttpAgent.createSync({
      identity,
      host,
      verifyQuerySignatures: false,
    });

    this.server = createActor(canisterId, { agent });

    this.loadState(world).then(() => {
      setIsConnecting(false);
      this.startPolling(world);
      setIsConnected(true);
    });
  }

  private async loadState(world: World) {
    if (this.server === null) {
      throw new Error('Not connected to the canister');
    }
    // Replace this with the actual call to your backend to fetch the initial state
    const updates = await this.server.getState();
    this.handleUpdates(world, updates);
  }

  private startPolling(world: World) {
    if (this.server === null) {
      throw new Error('Not connected to the canister');
    }

    this.pollingInterval = window.setInterval(async () => {
      try {
        const updates = await this.server!.getUpdates(BigInt(this.lastUpdate));

        if (updates.length > 0) {
          console.log(updates);
          this.handleUpdates(world, updates);
        }
      } catch (error) {
        console.log('Error fetching updates:', error);
      }
    }, 300);
  }

  private setLastUpdate(time: bigint) {
    if (time > this.lastUpdate) {
      this.lastUpdate = time;
    }
  }

  private handleUpdates(world: World, updates: Update[]) {
    updates.forEach((action) => {
      match(action)
        .with({ Insert: P.select() }, (action) => {
          this.setLastUpdate(action.timestamp);
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
  }

  public disconnect() {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log('Disconnected from the canister');
  }
}
