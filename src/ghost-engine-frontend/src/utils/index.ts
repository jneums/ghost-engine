import { Principal } from '@dfinity/principal';
import { PrincipalComponent } from '../components';
import { Entity } from '../hooks/entity';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const isPrincipalEqual = (
  principal1?: Principal,
  principal2?: Principal,
) => {
  return (
    principal1 !== undefined && principal1?.toText() === principal2?.toText()
  );
};

export function getPrincipal(entity: Entity): Principal | undefined {
  const component = entity.getComponent(PrincipalComponent);
  return component?.principal;
}

export function findPlayersEntityId(entities: Entity[], principal: Principal) {
  if (!entities) return;

  for (const entity of entities.values()) {
    const component = entity.getComponent(PrincipalComponent);
    if (component?.principal.compareTo(principal) === 'eq') {
      return entity.id;
    }
  }
}
