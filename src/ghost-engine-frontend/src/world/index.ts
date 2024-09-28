import { Entity } from './entity';

/**
 * An entity is just an ID. This is used to look up its associated
 * Components.
 */
export type EntityId = number;

/**
 * A Component is a bundle of state. Each instance of a Component is
 * associated with a single Entity.
 *
 * Components have no API to fulfill.
 */
export abstract class Component {}

/**
 * This type is so functions like the Entity's get(...) will
 * automatically tell TypeScript the type of the Component returned. In
 * other words, we can say get(Position) and TypeScript will know that an
 * instance of Position was returned. This is amazingly helpful.
 */
export type ComponentClass<T extends Component> = new (...args: any[]) => T;

/**
 * The World is the main driver; it's the backbone of the engine that
 * coordinates Entities, Components, and Systems. You could have a single
 * one for your game, or make a different one for every level, or have
 * multiple for different purposes.
 */
export class World {
  // Main state
  private entities = new Map<EntityId, Entity>();

  // Bookkeeping for entities.
  private entitiesToDestroy = new Array<EntityId>();

  // Set up subscriptions to the ECS.
  private subscribers: Set<() => void> = new Set();

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback());
  }

  public subscribe(callback: () => void) {
    this.subscribers.add(callback);
  }

  public unsubscribe(callback: () => void) {
    this.subscribers.delete(callback);
  }

  // API: Entities
  public getEntities(): EntityId[] {
    return Array.from(this.entities.keys());
  }

  public getEntitiesByArchetype(componentClasses: Function[]): EntityId[] {
    return Array.from(this.entities.keys()).filter((entityId) => {
      const entity = this.getEntity(entityId);
      return entity.hasAllComponents(componentClasses);
    });
  }

  public getEntity(entityId: EntityId): Entity {
    if (this.entities.has(entityId)) {
      return this.entities.get(entityId)!;
    } else {
      this.entities.set(entityId, new Entity(entityId));
      return this.entities.get(entityId)!;
    }
  }

  /**
   * Marks `entity` for removal. The actual removal happens at the end
   * of the next `update()`. This way we avoid subtle bugs where an
   * Entity is removed mid-`update()`, with some Systems seeing it and
   * others not.
   */
  public removeEntity(entityId: EntityId): void {
    this.entitiesToDestroy.push(entityId);
  }

  // API: Components

  public addComponent(entityId: EntityId, component: Component): void {
    const entity = this.getEntity(entityId);
    entity.addComponent(component);
    this.notifySubscribers();
  }

  public removeComponent(entityId: EntityId, componentClass: Function): void {
    const entity = this.getEntity(entityId);
    entity.deleteComponent(componentClass);
    this.notifySubscribers();
  }
}
