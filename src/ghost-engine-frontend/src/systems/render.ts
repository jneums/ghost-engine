import { System } from '.';
import { PositionComponent, VelocityComponent } from '../components';
import { EntityId, World } from '../ecs';

export class RenderSystem implements System {
  public componentsRequired = new Set([PositionComponent, VelocityComponent]);
  public ecs: World | null = null;

  public update(entities: Set<EntityId>, deltaTime: number) {
    for (const entityId of entities) {
      const entity = this.ecs?.getEntity(entityId);

      const p = entity?.getComponent(PositionComponent);
      const v = entity?.getComponent(VelocityComponent);

      if (p && v) {
        p.position.x += v.velocity.x * deltaTime;
        p.position.y += v.velocity.y * deltaTime;
        p.position.z += v.velocity.z * deltaTime;
      }
    }
  }
}
