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
import { SignIdentity } from '@dfinity/agent';
import { findPlayersEntityId } from '../utils';
import { HealthComponent, PrincipalComponent } from '../components';

export interface WorldState {
  world: World;
  connection: Connection;
  playerEntityId?: number;
  isPlayerDead?: boolean;
}

const initialState: WorldState = {
  world: new World(),
  connection: new Connection(),
  playerEntityId: undefined,
  isPlayerDead: false,
};

const WorldContext = createContext<WorldState>(initialState);

export const WorldProvider = ({ children }: { children: ReactNode }) => {
  const { identity } = useInternetIdentity();
  const worldRef = useRef<World>(new World());
  const connectionRef = useRef<Connection>(new Connection());
  const [tick, setTick] = useState(0);

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

  useEffect(() => {
    if (identity && !connectionRef.current.isConnected) {
      connectionRef.current.initialize(
        identity as SignIdentity,
        worldRef.current,
      );
    }
  }, [connectionRef.current, identity]);

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
        isPlayerDead,
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
