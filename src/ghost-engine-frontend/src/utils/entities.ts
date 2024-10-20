import { Principal } from '@dfinity/principal';
import { PrincipalComponent } from '../ecs/components';
import { Entity } from '../ecs/entity';

export function getPrincipal(entity: Entity): Principal | undefined {
  const component = entity.getComponent(PrincipalComponent);
  return component?.principal;
}
