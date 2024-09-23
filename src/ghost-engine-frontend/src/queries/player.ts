import { PrincipalComponent } from '../components';
import { World } from '../ecs';

export function getPrincipal(world: World, entityId: number) {
  const component = world.getEntity(entityId).getComponent(PrincipalComponent);
  return component?.principal;
}
