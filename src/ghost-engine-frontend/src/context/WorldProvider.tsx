import React, {
  createContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { ComponentConstructors, createComponentClass } from '../components';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useConnection } from './ConnectionProvider';
import { match, P } from 'ts-pattern';
import { Component, Entity, EntityId } from '../ecs';

interface WorldContextType {
  entities: Map<EntityId, Entity>;
  getEntity: (entityId: EntityId) => Entity;
  addComponent: (entityId: EntityId, component: Component) => void;
  removeComponent: (entityId: EntityId, componentClass: Function) => void;
  getEntities: () => EntityId[];
  getEntitiesByArchetype: (componentClasses: Function[]) => EntityId[];
  playerEntityId: EntityId | undefined;
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
  const { updates, disconnect } = useConnection();
  const [entities, setEntities] = useState<Map<EntityId, Entity>>(new Map());
  const playerEntityIdRef = React.useRef<EntityId | undefined>(undefined);

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
        const newEntities = new Map(prev);
        const entity = newEntities.get(entityId);
        if (!entity) {
          // If the entity doesn't exist, create a new one
          const newEntity = new Entity(entityId);
          newEntity.addComponent(component);
          newEntities.set(entityId, newEntity);
        } else {
          // Clone the entity and add the component
          entity.addComponent(component);
          newEntities.set(entityId, entity);
        }
        return newEntities; // Return a new Map reference
      });
    },
    [],
  );

  const removeComponent = useCallback(
    (entityId: EntityId, componentClass: Function) => {
      setEntities((prev) => {
        const newEntities = new Map(prev);
        const entity = newEntities.get(entityId);
        if (entity) {
          entity.deleteComponent(componentClass);
          newEntities.set(entityId, entity);
        }
        return newEntities; // Return a new Map reference
      });
    },
    [],
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
    if (!identity) {
      return;
    }

    console.log(updates);
    updates.forEach((action) => {
      match(action)
        .with({ Insert: P.select() }, (action) => {
          const component = createComponentClass(action.component);
          addComponent(Number(action.entityId), component);

          // If the component is a PrincipalComponent, we need to check if it's the player
          // and set the playerEntityId
          match(action.component).with(
            { PrincipalComponent: P.select() },
            ({ principal }) => {
              if (principal.compareTo(identity.getPrincipal()) === 'eq') {
                console.log('Setting player entity id: ' + action.entityId);
                playerEntityIdRef.current = Number(action.entityId);
              }
            },
          );
        })
        .with({ Delete: P.select() }, (action) => {
          const constructor = ComponentConstructors[action.componentType];
          removeComponent(Number(action.entityId), constructor);

          // If the component is a SessionComponent, we need to check if it's the player
          // entity and disconnect the user if it is
          match(action.componentType).with('SessionComponent', () => {
            if (Number(action.entityId) === playerEntityIdRef.current) {
              disconnect();
            }
          });
        })
        .otherwise(() => {
          console.log('Message is not Insert or Delete!');
        });
    });
  }, [updates, identity, addComponent, removeComponent, disconnect]);

  return (
    <WorldContext.Provider
      value={{
        entities,
        getEntity,
        addComponent,
        removeComponent,
        getEntities,
        getEntitiesByArchetype,
        playerEntityId: playerEntityIdRef.current,
      }}>
      {children}
    </WorldContext.Provider>
  );
};
