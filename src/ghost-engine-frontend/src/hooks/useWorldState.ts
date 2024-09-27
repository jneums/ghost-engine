import { useReducer, useCallback } from 'react';
import { Entity } from './entity';

export type EntityId = number;

export abstract class Component {}

export type ComponentClass<T extends Component> = new (...args: any[]) => T;

export interface WorldState {
  entities: Map<EntityId, Entity>;
  entitiesToDestroy: EntityId[];
}

const initialState: WorldState = {
  entities: new Map<EntityId, Entity>(),
  entitiesToDestroy: [],
};

type Action =
  | { type: 'ADD_ENTITY'; entityId: EntityId }
  | { type: 'REMOVE_ENTITY'; entityId: EntityId }
  | { type: 'ADD_COMPONENT'; entityId: EntityId; component: Component }
  | { type: 'REMOVE_COMPONENT'; entityId: EntityId; componentClass: Function };

const worldReducer = (state: WorldState, action: Action): WorldState => {
  switch (action.type) {
    case 'ADD_ENTITY': {
      const newEntities = new Map(state.entities);
      newEntities.set(action.entityId, new Entity(action.entityId));
      return { ...state, entities: newEntities };
    }
    case 'REMOVE_ENTITY': {
      const newEntities = new Map(state.entities);
      newEntities.delete(action.entityId);
      return { ...state, entities: newEntities };
    }
    case 'ADD_COMPONENT': {
      const newEntities = new Map(state.entities);
      const entity =
        newEntities.get(action.entityId) || new Entity(action.entityId);
      entity.addComponent(action.component);
      newEntities.set(action.entityId, entity);
      return { ...state, entities: newEntities };
    }
    case 'REMOVE_COMPONENT': {
      const newEntities = new Map(state.entities);
      const entity = newEntities.get(action.entityId);
      if (entity) {
        entity.deleteComponent(action.componentClass);
        newEntities.set(action.entityId, entity);
      }
      return { ...state, entities: newEntities };
    }

    default:
      return state;
  }
};

export interface World {
  state: WorldState;
  dispatch: React.Dispatch<Action>;
  addComponent: (entityId: EntityId, component: Component) => void;
  removeComponent: (entityId: EntityId, componentClass: Function) => void;
  getEntity: (entityId: EntityId) => Entity | undefined;
  getEntities: () => IterableIterator<EntityId>;
  getEntitiesByArchetype: (componentClasses: Function[]) => EntityId[];
}

export const useWorldState = () => {
  const [state, dispatch] = useReducer(worldReducer, initialState);

  const addComponent = useCallback(
    (entityId: EntityId, component: Component) => {
      dispatch({ type: 'ADD_COMPONENT', entityId, component });
    },
    [],
  );

  const removeComponent = useCallback(
    (entityId: EntityId, componentClass: Function) => {
      dispatch({ type: 'REMOVE_COMPONENT', entityId, componentClass });
    },
    [],
  );

  const getEntity = useCallback(
    (entityId: EntityId) => {
      return state.entities.get(entityId);
    },
    [state.entities],
  );

  const getEntities = useCallback(() => {
    return state.entities.keys();
  }, [state.entities]);

  const getEntitiesByArchetype = useCallback(
    (componentClasses: Function[]) => {
      const entities: EntityId[] = [];
      for (const [entityId, entity] of state.entities) {
        if (entity.hasAllComponents(componentClasses)) {
          entities.push(entityId);
        }
      }
      return entities;
    },
    [state.entities],
  );

  const world: World = {
    state,
    dispatch,
    addComponent,
    removeComponent,
    getEntity,
    getEntities,
    getEntitiesByArchetype,
  };

  return world;
};
