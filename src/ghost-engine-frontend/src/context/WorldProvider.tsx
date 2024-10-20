import { create } from 'zustand';
import React, { ReactNode, useEffect } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useConnection } from './ConnectionProvider';
import { match, P } from 'ts-pattern';
import { Component, Entity, EntityId } from '../ecs/entity';
import { ComponentConstructors, createComponentClass } from '../ecs/components';

// Define the Zustand store
interface WorldState {
  entities: Map<EntityId, Entity>;
  unitEntityId: EntityId | undefined;
  activeBlock: number | null;
  getEntity: (entityId: EntityId) => Entity;
  addComponent: (entityId: EntityId, component: Component) => void;
  removeComponent: (entityId: EntityId, componentClass: Function) => void;
  getEntities: () => EntityId[];
  getEntitiesByArchetype: (componentClasses: Function[]) => EntityId[];
  setUnitEntityId: (entityId: EntityId) => void;
  setActiveBlock: (blockType: number | null) => void;
}

const useWorldStore = create<WorldState>((set, get) => ({
  entities: new Map(),
  unitEntityId: undefined,
  activeBlock: null,
  getEntity: (entityId: EntityId) => {
    const { entities } = get();
    if (!entities.has(entityId)) {
      const newEntity = new Entity(entityId);
      set((state) => ({
        entities: new Map(state.entities).set(entityId, newEntity),
      }));
      return newEntity;
    }
    return entities.get(entityId)!;
  },
  addComponent: (entityId: EntityId, component: Component) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      const entity = newEntities.get(entityId);
      if (!entity) {
        const newEntity = new Entity(entityId);
        newEntity.addComponent(component);
        newEntities.set(entityId, newEntity);
      } else {
        entity.addComponent(component);
        newEntities.set(entityId, entity);
      }
      return { entities: newEntities };
    });
  },
  removeComponent: (entityId: EntityId, componentClass: Function) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      const entity = newEntities.get(entityId);
      if (entity) {
        entity.deleteComponent(componentClass);
        newEntities.set(entityId, entity);
      }
      return { entities: newEntities };
    });
  },
  getEntities: () => {
    return Array.from(get().entities.keys());
  },
  getEntitiesByArchetype: (componentClasses: Function[]) => {
    return Array.from(get().entities.keys()).filter((entityId) => {
      const entity = get().getEntity(entityId);
      return entity.hasAllComponents(componentClasses);
    });
  },
  setUnitEntityId: (entityId: EntityId) => {
    set({ unitEntityId: entityId });
  },
  setActiveBlock: (blockType: number | null) => {
    set({ activeBlock: blockType });
  },
}));

export const useWorld = () => useWorldStore();

export const WorldProvider = ({ children }: { children: ReactNode }) => {
  const { identity } = useInternetIdentity();
  const { updates, disconnect } = useConnection();
  const { addComponent, removeComponent, setUnitEntityId } = useWorldStore();

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

          match(action.component).with(
            { PrincipalComponent: P.select() },
            ({ principal }) => {
              if (principal.compareTo(identity.getPrincipal()) === 'eq') {
                console.log('Setting unit entity id: ' + action.entityId);
                setUnitEntityId(Number(action.entityId));
              }
            },
          );
        })
        .with({ Delete: P.select() }, (action) => {
          const constructor = ComponentConstructors[action.componentType];
          removeComponent(Number(action.entityId), constructor);

          match(action.componentType).with('SessionComponent', () => {
            if (
              Number(action.entityId) === useWorldStore.getState().unitEntityId
            ) {
              disconnect(identity);
            }
          });
        })
        .otherwise(() => {
          console.log('Message is not Insert or Delete!');
        });
    });
  }, [
    updates,
    identity,
    addComponent,
    removeComponent,
    disconnect,
    setUnitEntityId,
  ]);

  return <>{children}</>;
};
