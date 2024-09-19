import { ECSManager, Entity } from '../ecs';

/**
 * A System cares about a set of Components. It will run on every Entity
 * that has that set of Components.
 *
 * A System must specify two things:
 *
 *  (1) The immutable set of Components it needs at compile time. (Its
 *      immutability isn't enforced by anything but my wrath.) We use the
 *      type `Function` to refer to a Component's class; i.e., `Position`
 *      (class) rather than `new Position()` (instance).
 *
 *  (2) An update() method for what to do every frame (if anything).
 */
export abstract class System {
  /**
   * Set of Component classes, ALL of which are required before the
   * system is run on an entity.
   *
   * This should be defined at compile time and should never change.
   */
  public abstract componentsRequired: Set<Function>;

  /**
   * update() is called on the System every frame.
   */
  public abstract update(entities: Set<Entity>, deltaTime: number): void;

  /**
   * The ECS is given to all Systems. Systems contain most of the game
   * code, so they need to be able to create, mutate, and destroy
   * Entities and Components.
   */
  public ecs: ECSManager | null = null;
}
