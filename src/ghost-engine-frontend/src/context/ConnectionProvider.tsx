import { create } from 'zustand';
import React, { useEffect } from 'react';
import { HttpAgent, Identity } from '@dfinity/agent';
import { canisterId, createActor } from '../declarations/ghost-engine-backend';
import {
  _SERVICE,
  Action,
  Update,
} from '../declarations/ghost-engine-backend/ghost-engine-backend.did';
import { useInternetIdentity } from 'ic-use-internet-identity';
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
  getChunk: (
    identity: Identity,
    chunkId: { x: number; y: number; z: number },
  ) => Promise<Uint8Array | number[]>;
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
      const initialUpdates = await server.getState();
      console.log('Fetching initial updates');
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
    }, 1000);
  };

  const send = async (identity: Identity, message: Action) => {
    const server = createServer(identity);
    await server.putAction(message);
  };

  const getChunk = async (
    identity: Identity,
    chunkId: { x: number; y: number; z: number },
  ) => {
    const server = createServer(identity);
    return await server.getChunk(chunkId);
  };

  return {
    updates: [],
    isConnected: false,
    isConnecting: false,
    lastUpdate: 0n,
    connect,
    disconnect,
    send,
    getChunk,
  };
});

export const useConnection = () => useConnectionStore();

export const ConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { connect, disconnect } = useConnectionStore();
  const { identity } = useInternetIdentity();

  useEffect(() => {
    if (identity) {
      connect(identity);
    }

    return () => {
      if (identity) {
        disconnect(identity);
      }
    };
  }, [identity, connect, disconnect]);

  return <>{children}</>;
};