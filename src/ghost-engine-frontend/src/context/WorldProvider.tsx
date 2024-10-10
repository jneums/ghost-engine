import React, {
  createContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  ComponentConstructors,
  createComponentClass,
  HealthComponent,
  PrincipalComponent,
  SessionComponent,
} from '../components';
import { Principal } from '@dfinity/principal';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useConnection } from './ConnectionProvider';
import { match, P } from 'ts-pattern';
import ConnectAction from '../actions/connect-action';
import { Component, Entity, EntityId } from '../ecs';

interface WorldContextType {
  entities: Map<EntityId, Entity>;
  getEntity: (entityId: EntityId) => Entity;
  addComponent: (entityId: EntityId, component: Component) => void;
  removeComponent: (entityId: EntityId, componentClass: Function) => void;
  getEntities: () => EntityId[];
  getEntitiesByArchetype: (componentClasses: Function[]) => EntityId[];
  isPlayerDead: boolean;
  playerEntityId: EntityId | undefined;
  session?: number;
}

const WorldContext = createContext<WorldContextType | undefined>(undefined);

export const useWorld = (): WorldContextType => {
  const context = React.useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
};

export const WorldProvider = ({ children }: { children: ReactNode }) => {
  const { identity } = useInternetIdentity();
  const { updates, send } = useConnection();
  const [entities, setEntities] = useState<Map<EntityId, Entity>>(new Map());
  const [playerEntityId, setPlayerEntityId] = useState<EntityId | undefined>(
    undefined,
  );
  const [isPlayerDead, setIsPlayerDead] = useState<boolean>(false);
  const [session, setSession] = useState<number | undefined>(undefined);

  const getEntity = useCallback(
    (entityId: EntityId): Entity => {
      if (!entities.has(entityId)) {
        const newEntity = new Entity(entityId);
        setEntities((prev) => new Map(prev).set(entityId, newEntity));
        return newEntity;
      }
      return entities.get(entityId)!;
    },
    [entities],
  );

  const addComponent = useCallback(
    (entityId: EntityId, component: Component) => {
      setEntities((prev) => {
        const entity = prev.get(entityId);
        if (!entity) {
          // If the entity doesn't exist, create a new one
          const newEntity = new Entity(entityId);
          newEntity.addComponent(component);
          return new Map(prev).set(entityId, newEntity);
        } else {
          // Clone the entity and add the component
          entity.addComponent(component);
          return new Map(prev).set(entityId, entity);
        }
      });
    },
    [],
  );

  const removeComponent = useCallback(
    (entityId: EntityId, componentClass: Function) => {
      const entity = getEntity(entityId);
      entity.deleteComponent(componentClass);
      setEntities((prev) => new Map(prev));
    },
    [getEntity],
  );

  const getEntities = useCallback((): EntityId[] => {
    return Array.from(entities.keys());
  }, [entities]);

  const getEntitiesByArchetype = useCallback(
    (componentClasses: Function[]): EntityId[] => {
      return Array.from(entities.keys()).filter((entityId) => {
        const entity = getEntity(entityId);
        return entity.hasAllComponents(componentClasses);
      });
    },
    [entities, getEntity],
  );

  useEffect(() => {
    const updatePlayerState = () => {
      const playerEntities = getEntitiesByArchetype([PrincipalComponent]);
      const playerEntity = playerEntities.find((entityId) => {
        const entity = getEntity(entityId);
        const component = entity.getComponent(PrincipalComponent);
        return (
          component?.principal.compareTo(
            identity?.getPrincipal() || Principal.anonymous(),
          ) === 'eq'
        );
      });

      setPlayerEntityId(playerEntity);

      if (playerEntity !== undefined) {
        const entity = getEntity(playerEntity);
        const health = entity.getComponent(HealthComponent);
        setIsPlayerDead(health?.amount <= 0);

        const session = entity.getComponent(SessionComponent);
        if (session) {
          setSession(session.lastAction);
        } else {
          setSession(undefined);
        }
      } else {
        setIsPlayerDead(false);
      }
    };

    updatePlayerState();
  }, [entities, getEntitiesByArchetype, getEntity, identity]);

  useEffect(() => {
    console.log(updates);
    updates.forEach((action) => {
      match(action)
        .with({ Insert: P.select() }, (action) => {
          const component = createComponentClass(action.component);
          addComponent(Number(action.entityId), component);
        })
        .with({ Delete: P.select() }, (action) => {
          const constructor = ComponentConstructors[action.componentType];
          removeComponent(Number(action.entityId), constructor);
        })
        .otherwise(() => {
          console.log('Message is not Insert or Delete!');
        });
    });
  }, [updates]);

  useEffect(() => {
    if (!session && identity) {
      const connectAction = new ConnectAction(send);
      connectAction.handle({ principal: identity.getPrincipal() });
    }
  }, [session, identity, send]);

  return (
    <WorldContext.Provider
      value={{
        entities,
        getEntity,
        addComponent,
        removeComponent,
        getEntities,
        getEntitiesByArchetype,
        isPlayerDead,
        playerEntityId,
        session,
      }}>
      {children}
    </WorldContext.Provider>
  );
};
