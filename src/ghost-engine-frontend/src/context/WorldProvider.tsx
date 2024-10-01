import React, {
  createContext,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { World } from '../world';
import { Connection } from '../connection';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { findPlayersEntityId } from '../utils';
import { HealthComponent, PrincipalComponent } from '../components';
import { Principal } from '@dfinity/principal';
import ConnectAction from '../actions/connect-action';
import DisconnectAction from '../actions/disconnect-action';

export interface WorldState {
  world: World;
  connection: Connection;
  playerEntityId?: number;
  playerPrincipalId?: Principal;
  isPlayerDead: boolean;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
}

const initialState: WorldState = {
  world: new World(),
  connection: new Connection(),
  playerEntityId: undefined,
  playerPrincipalId: undefined,
  isPlayerDead: false,
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
  const [tick, setTick] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const playerEntityId = useMemo(() => {
    if (!identity) {
      return;
    }
    const playerEntityId = findPlayersEntityId(
      worldRef.current,
      worldRef.current.getEntitiesByArchetype([PrincipalComponent]),
      identity.getPrincipal(),
    );
    return playerEntityId;
  }, [worldRef.current, identity, tick]);

  const isPlayerDead = useMemo(() => {
    if (!playerEntityId) {
      return false;
    }
    const entity = worldRef.current.getEntity(playerEntityId);
    if (!entity) {
      return true;
    }
    const health = entity.getComponent(HealthComponent);
    return health?.amount <= 0;
  }, [playerEntityId, worldRef.current, tick]);

  const connect = () => {
    if (!identity) {
      throw new Error('Identity not found');
    }

    connectionRef.current.initialize(
      worldRef.current,
      setIsConnected,
      setIsConnecting,
    );

    const connectAction = new ConnectAction(
      worldRef.current,
      connectionRef.current,
    );
    connectAction.handle({ principal: identity.getPrincipal() });
  };

  const disconnect = () => {
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
  };

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
        playerEntityId,
        playerPrincipalId: identity?.getPrincipal(),
        isPlayerDead,
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
