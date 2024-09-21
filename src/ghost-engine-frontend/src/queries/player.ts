import { PrincipalComponent } from '../components';
import { World } from '../ecs';

export function getPrincipal(ecs: World, entityId: number) {
  const component = ecs.getEntity(entityId).getComponent(PrincipalComponent);
  console.log('component', component);
  return component?.principal;
}
