import { Principal } from '@dfinity/principal';
import { PrincipalComponent } from '../components';
import { Entity } from '../world/entity';
import { EntityId, World } from '../world';

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

export function findPlayersEntityId(
  world: World,
  entities: EntityId[],
  principal: Principal,
) {
  if (!entities) return;

  for (const entityId of entities.values()) {
    const entity = world.getEntity(entityId);
    const component = entity.getComponent(PrincipalComponent);
    if (component?.principal.compareTo(principal) === 'eq') {
      return entity.id;
    }
  }
}

/**
 * Convert icp tothe  base unit used for processing ICP on the IC - e8s.
 * @param icp number
 * @returns icp in e8s
 */
export const toE8s = (value: number) => value * 100_000_000;

/**
 * Convert e8s back to icp
 * @param e8s bigint
 * @returns icp as a number
 */
export const fromE8s = (value: bigint) => Number(value) / 100_000_000;
