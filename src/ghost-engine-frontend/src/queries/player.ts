import { Principal } from '@dfinity/principal';
import { PrincipalComponent } from '../components';
import { World } from '../ecs';

export function getPrincipal(world: World, entityId: number) {
  const component = world.getEntity(entityId).getComponent(PrincipalComponent);
  return component?.principal;
}
export function findPlayersEntityId(world: World, principal: Principal) {
  for (const entityId of world.getEntities()) {
    const entity = world.getEntity(entityId);
    const component = entity.getComponent(PrincipalComponent);
    if (component?.principal.compareTo(principal) === 'eq') {
      return entityId;
    }
  }
}
