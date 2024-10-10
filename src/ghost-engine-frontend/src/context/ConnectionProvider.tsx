import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { HttpAgent } from '@dfinity/agent';
import { canisterId, createActor } from '../declarations/ghost-engine-backend';
import {
  _SERVICE,
  Action,
  Update,
} from '../declarations/ghost-engine-backend/ghost-engine-backend.did';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { match, P } from 'ts-pattern';

type Props = {
  children: React.ReactNode;
};

interface ConnectionContextType {
  updates: Update[];
  send: (message: Action) => Promise<void>;
  getChunk: (chunkId: {
    x: number;
    y: number;
    z: number;
  }) => Promise<Uint8Array | number[]>;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined,
);

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

export const ConnectionProvider = ({ children }: Props) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { identity } = useInternetIdentity();
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const lastUpdateRef = useRef<bigint>(0n); // Create a ref for lastUpdate
  const [updates, setUpdates] = useState<Update[]>([]);

  const createServer = useCallback(() => {
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
  }, [identity]);

  const connect = useCallback(() => {
    if (!identity) {
      throw new Error('Identity not found');
    }

    setIsConnecting(true);

    send({
      Connect: {
        principal: identity.getPrincipal(),
      },
    });

    const loadState = async () => {
      const server = createServer();
      const initialUpdates = await server.getState();
      setUpdates(initialUpdates);
      // Reset lastUpdateRef to the latest timestamp from initialUpdates
      const latestTimestamp = initialUpdates.reduce((max, update) => {
        const timestamp = match(update)
          .with({ Insert: P.select() }, ({ timestamp }) => timestamp)
          .with({ Delete: P.select() }, ({ timestamp }) => timestamp)
          .exhaustive();
        return timestamp > max ? timestamp : max;
      }, 0n);
      lastUpdateRef.current = latestTimestamp;
    };

    loadState().then(() => {
      setIsConnecting(false);
      startPolling();
      setIsConnected(true);
    });
  }, [identity, createServer]);

  const disconnect = useCallback(() => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    // Notify the backend of the action
    if (identity) {
      send({
        Disconnect: {
          principal: identity.getPrincipal(),
        },
      });
    }

    // Reset state
    setUpdates([]);
    lastUpdateRef.current = 0n;

    setIsConnected(false);
    console.log('Disconnected from the canister');
  }, [pollingInterval, identity]);

  const startPolling = useCallback(() => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    const interval = window.setInterval(async () => {
      try {
        const server = createServer();
        const newUpdates = await server.getUpdates(lastUpdateRef.current);

        if (newUpdates.length > 0) {
          const latestTimestamp = newUpdates.reduce((max, update) => {
            const timestamp = match(update)
              .with({ Insert: P.select() }, ({ timestamp }) => timestamp)
              .with({ Delete: P.select() }, ({ timestamp }) => timestamp)
              .exhaustive();
            return timestamp > max ? timestamp : max;
          }, lastUpdateRef.current);

          lastUpdateRef.current = latestTimestamp; // Update the ref

          setUpdates(newUpdates);
        }
      } catch (error) {
        console.log('Error fetching updates:', error);
        disconnect();
      }
    }, 500);

    setPollingInterval(interval);
  }, [createServer, disconnect]);

  const send = async (message: Action) => {
    const server = createServer();
    await server.putAction(message);
  };

  const getChunk = async (chunkId: {
    x: number;
    y: number;
    z: number;
  }): Promise<Uint8Array | number[]> => {
    const server = createServer();
    return await server.getChunk(chunkId);
  };

  useEffect(() => {
    if (identity) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [identity]);

  return (
    <ConnectionContext.Provider
      value={{
        updates,
        send,
        getChunk,
        connect,
        disconnect,
        isConnected,
        isConnecting,
      }}>
      {children}
    </ConnectionContext.Provider>
  );
};
