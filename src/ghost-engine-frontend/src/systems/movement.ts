import { System } from '.';
import { Position, Velocity } from '../components';
import { ECSManager, Entity } from '../ecs';

export class MovementSystem implements System {
  public componentsRequired = new Set([Position, Velocity]);
  public ecs: ECSManager | null = null;

  public update(entities: Set<Entity>, deltaTime: number) {
    for (const entity of entities) {
      const container = this.ecs?.getContainer(entity);

      const position = container?.getComponent(Position);
      const velocity = container?.getComponent(Velocity);

      if (position && velocity) {
        position.x += velocity.x * deltaTime;
        position.y += velocity.y * deltaTime;
        position.z += velocity.z * deltaTime;
      }
    }
  }
}
