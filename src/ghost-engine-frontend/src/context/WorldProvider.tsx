import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { World } from '../world';
import { Connection } from '../connection';
import { useInternetIdentity } from 'ic-use-internet-identity';
import ConnectAction from '../actions/connect-action';
import DisconnectAction from '../actions/disconnect-action';

export interface WorldState {
  world: World;
  connection: Connection;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
}

const initialState: WorldState = {
  world: new World(),
  connection: new Connection(),
  connect: () => {},
  disconnect: () => {},
  isConnected: false,
  isConnecting: false,
};

const WorldContext = createContext<WorldState>(initialState);

export const WorldProvider = ({ children }: { children: ReactNode }) => {
  const { identity, clear } = useInternetIdentity();
  const worldRef = useRef<World>(new World());
  const connectionRef = useRef<Connection>(new Connection());
  const [_, setTick] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(() => {
    if (!identity) {
      throw new Error('Identity not found');
    }

    worldRef.current = new World();

    connectionRef.current.initialize(
      identity,
      worldRef.current,
      setIsConnected,
      setIsConnecting,
    );

    const connectAction = new ConnectAction(
      worldRef.current,
      connectionRef.current,
    );
    connectAction.handle({ principal: identity.getPrincipal() });
  }, [identity]);

  const disconnect = useCallback(() => {
    if (!identity) {
      throw new Error('Identity not found');
    }

    connectionRef.current.disconnect();
    clear();

    const connectAction = new DisconnectAction(
      worldRef.current,
      connectionRef.current,
    );
    connectAction.handle({ principal: identity.getPrincipal() });
  }, [identity]);

  useEffect(() => {
    if (identity) {
      connect();
    }

    return () => {
      connectionRef.current.disconnect();
    };
  }, [identity]);

  useEffect(() => {
    const callback = () => setTick((tick) => tick + 1);
    worldRef.current.subscribe(callback);
    return () => {
      worldRef.current.unsubscribe(callback);
    };
  }, [worldRef.current]);

  return (
    <WorldContext.Provider
      value={{
        world: worldRef.current,
        connection: connectionRef.current,
        connect,
        disconnect,
        isConnected,
        isConnecting,
      }}>
      {children}
    </WorldContext.Provider>
  );
};

export const useWorld = (): WorldState => {
  const context = React.useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
};
