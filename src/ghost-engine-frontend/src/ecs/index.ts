import { Entity } from './entity';
import { System } from '../systems';

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
  private systems = new Map<System, Set<EntityId>>();

  // Bookkeeping for entities.
  private entitiesToDestroy = new Array<EntityId>();

  // API: Entities
  public getEntities(): EntityId[] {
    return Array.from(this.entities.keys());
  }

  public getEntity(entityId: EntityId): Entity {
    if (this.entities.has(entityId)) {
      return this.entities.get(entityId)!;
    } else {
      this.entities.set(entityId, new Entity());
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
    this.entityRegistration(entityId);
  }

  public removeComponent(entityId: EntityId, componentType: string): void {
    const entity = this.getEntity(entityId);
    entity.deleteComponent(componentType);
    this.entityRegistration(entityId);
  }

  // API: Systems

  public addSystem(system: System): void {
    // Checking invariant: systems should not have an empty
    // Components list, or they'll run on every entity. Simply remove
    // or special case this check if you do want a System that runs
    // on everything.
    if (system.componentsRequired.size == 0) {
      console.warn('System not added: empty Components list.');
      console.warn(system);
      return;
    }

    // Give system a reference to the ECS so it can actually do
    // anything.
    system.ecs = this;

    // Save system and set who it should track immediately.
    this.systems.set(system, new Set());
    for (let entityId of this.entities.keys()) {
      this.entityRegistrationWithSystem(entityId, system);
    }
  }

  /**
   * Note: I never actually had a removeSystem() method for the entire
   * time I was programming the game Fallgate (2 years!). I just added
   * one here for a specific testing reason (see the next post).
   * Because it's just for demo purposes, this requires an actual
   * instance of a System to remove (which would be clunky as a real
   * API).
   */
  public removeSystem(system: System): void {
    this.systems.delete(system);
  }

  /**
   * This is ordinarily called once per tick (e.g., every frame). It
   * updates all Systems, then destroys any Entities that were marked
   * for removal.
   */
  public update(deltaTime: number): void {
    // Update all systems. (Later, we'll add a way to specify the
    // update order.)
    for (let [system, entities] of this.systems.entries()) {
      system.update(entities, deltaTime);
    }

    // Remove any entities that were marked for deletion during the
    // update.
    while (this.entitiesToDestroy.length > 0) {
      this.destroyEntity(this.entitiesToDestroy.pop()!);
    }
  }

  // Private methods for doing internal state checks and mutations.

  private destroyEntity(entityId: EntityId): void {
    this.entities.delete(entityId);
    for (let entities of this.systems.values()) {
      entities.delete(entityId); // no-op if doesn't have it
    }
  }

  private entityRegistration(entityId: EntityId): void {
    for (let system of this.systems.keys()) {
      this.entityRegistrationWithSystem(entityId, system);
    }
  }

  private entityRegistrationWithSystem(
    entityId: EntityId,
    system: System,
  ): void {
    let have = this.entities.get(entityId);
    let need = system.componentsRequired;
    if (have?.hasAllComponents(need)) {
      // should be in system
      this.systems.get(system)?.add(entityId); // no-op if in
    } else {
      // should not be in system
      this.systems.get(system)?.delete(entityId); // no-op if out
    }
  }
}
