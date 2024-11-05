import { create } from 'zustand';
import { HttpAgent, Identity } from '@dfinity/agent';
import { canisterId, createActor } from '../declarations/ghost-engine-backend';
import {
  _SERVICE,
  Action,
  Update,
} from '../declarations/ghost-engine-backend/ghost-engine-backend.did';
import { match, P } from 'ts-pattern';

// Define the Zustand store
interface ConnectionState {
  updates: Update[];
  isConnected: boolean;
  isConnecting: boolean;
  lastUpdate: bigint;
  connect: (identity: Identity) => void;
  disconnect: (identity: Identity) => void;
  send: (identity: Identity, message: Action) => Promise<void>;
  getChunks: (
    identity: Identity,
    chunkIds: { x: number; z: number }[],
  ) => Promise<(Uint16Array | number[])[]>;
}

const useConnectionStore = create<ConnectionState>((set, get) => {
  let pollingInterval: number | null = null;

  const createServer = (identity: Identity) => {
    if (!identity) {
      throw new Error('Identity not found');
    }

    const host =
      process.env.DFX_NETWORK === 'local'
        ? 'http://127.0.0.1:4943'
        : 'https://icp-api.io';

    const agent = HttpAgent.createSync({
      identity,
      host,
      verifyQuerySignatures: false,
    });

    return createActor(canisterId, { agent });
  };

  const connect = async (identity: Identity) => {
    if (!identity) {
      throw new Error('Identity not found');
    }

    set({ isConnecting: true });

    await get().send(identity, {
      Connect: {
        principal: identity.getPrincipal(),
      },
    });

    const loadState = async () => {
      const server = createServer(identity);
      let initialUpdates: Update[] = [];
      let attempts = 0;
      const maxAttempts = 5; // Maximum number of retry attempts
      const delay = 500; // Delay in milliseconds between retries

      while (initialUpdates.length === 0 && attempts < maxAttempts) {
        console.log('Fetching initial updates');
        initialUpdates = await server.getState();

        if (initialUpdates.length === 0) {
          console.log('No updates found, retrying...');
          attempts += 1;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (initialUpdates.length === 0) {
        console.error(
          'Failed to fetch initial updates after multiple attempts',
        );
        return;
      }

      set({ updates: initialUpdates });

      const latestTimestamp = initialUpdates.reduce((max, update) => {
        const timestamp = match(update)
          .with({ Insert: P.select() }, ({ timestamp }) => timestamp)
          .with({ Delete: P.select() }, ({ timestamp }) => timestamp)
          .exhaustive();
        return timestamp > max ? timestamp : max;
      }, 0n);
      set({ lastUpdate: latestTimestamp });
    };

    await loadState();
    set({ isConnecting: false, isConnected: true });
    startPolling(identity);
  };

  const disconnect = (identity: Identity) => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }

    if (identity) {
      get().send(identity, {
        Disconnect: {
          principal: identity.getPrincipal(),
        },
      });
    }

    set({ updates: [], isConnected: false, lastUpdate: 0n });
  };

  const startPolling = (identity: Identity) => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }

    pollingInterval = window.setInterval(async () => {
      try {
        const server = createServer(identity);
        const newUpdates = await server.getUpdates(get().lastUpdate);

        if (newUpdates.length > 0) {
          const latestTimestamp = newUpdates.reduce((max, update) => {
            const timestamp = match(update)
              .with({ Insert: P.select() }, ({ timestamp }) => timestamp)
              .with({ Delete: P.select() }, ({ timestamp }) => timestamp)
              .exhaustive();
            return timestamp > max ? timestamp : max;
          }, get().lastUpdate);

          set({
            updates: newUpdates,
            lastUpdate: latestTimestamp,
          });
        }
      } catch (error) {
        console.log('Error fetching updates:', error);
        disconnect(identity);
      }
    }, 500);
  };

  const send = async (identity: Identity, message: Action) => {
    const server = createServer(identity);
    await server.putAction(message);
  };

  const getChunks = async (
    identity: Identity,
    chunkIds: { x: number; z: number }[],
  ) => {
    const server = createServer(identity);
    const withY = chunkIds.map(({ x, z }) => ({ x, y: 0, z }));
    return await server.getChunks(withY);
  };

  return {
    updates: [],
    isConnected: false,
    isConnecting: false,
    lastUpdate: 0n,
    connect,
    disconnect,
    send,
    getChunks,
  };
});

export const useConnection = () => useConnectionStore();
