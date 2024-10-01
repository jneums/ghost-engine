import { ghost_engine_backend } from '../declarations/ghost-engine-backend';
import {
  _SERVICE,
  Action,
  Update,
} from '../declarations/ghost-engine-backend/ghost-engine-backend.did';
import { ComponentConstructors, createComponentClass } from '../components';
import { World } from '../world';
import { match, P } from 'ts-pattern';

export class Connection {
  private pollingInterval: number | null = null;
  private lastUpdate = 0n;

  public async send(message: Action) {
    // Implement the send logic if needed for polling
    await ghost_engine_backend.putAction(message);
  }

  public initialize(
    world: World,
    setIsConnected: (isConnected: boolean) => void,
    setIsConnecting: (isConnecting: boolean) => void,
  ) {
    setIsConnecting(true);
    this.loadState(world).then(() => {
      setIsConnecting(false);
      this.startPolling(world);
      setIsConnected(true);
    });
  }

  private async loadState(world: World) {
    // Replace this with the actual call to your backend to fetch the initial state
    const updates = await ghost_engine_backend.getState();
    this.handleUpdates(world, updates);
  }

  private startPolling(world: World) {
    this.pollingInterval = window.setInterval(async () => {
      try {
        const updates = await ghost_engine_backend.getUpdates(
          BigInt(this.lastUpdate),
        );

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
