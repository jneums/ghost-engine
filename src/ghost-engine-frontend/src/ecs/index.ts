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
 * This custom entity is so that calling code can provide the
 * Component *instance* when adding (e.g., add(new Position(...))), and
 * provide the Component *class* otherwise (e.g., get(Position),
 * has(Position), delete(Position)).
 *
 * We also use two different types to refer to the Component's class:
 * `Function` and `ComponentClass<T>`. We use `Function` in most cases
 * because it is simpler to write. We use `ComponentClass<T>` in the
 * `get()` method, when we want TypeScript to know the type of the
 * instance that is returned. Just think of these both as referring to
 * the same thing: the underlying class of the Component.
 *
 * You might notice a footgun here: code that gets this object can
 * directly modify the Components inside (with add(...) and delete(...)).
 * This would screw up our ECS bookkeeping of mapping Systems to
 * Entities! We'll fix this later by only returning callers a view onto
 * the Components that can't change them.
 */
export class Entity {
  private map = new Map<string, Component>();
  public id: number;

  constructor(id: number) {
    this.id = id;
  }

  public getArchetype(): Component[] {
    return Array.from(this.map.values()).map(
      (component) => component.constructor,
    );
  }

  public addComponent(component: Component): void {
    this.map.set(component.constructor.name, component);
  }

  public getComponent<T extends Component>(
    componentClass: ComponentClass<T>,
  ): T {
    return this.map.get(componentClass.name) as T;
  }

  public hasComponent(componentClass: Function): boolean {
    return this.map.has(componentClass.name);
  }

  public hasAllComponents(componentClasses: Iterable<Function>): boolean {
    for (let cls of componentClasses) {
      if (!this.map.has(cls.name)) {
        return false;
      }
    }
    return true;
  }

  public deleteComponent(componentClass: Function): void {
    this.map.delete(componentClass.name);
  }
}
