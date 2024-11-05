import {
  ClientTransformComponent,
  FungibleComponent,
  HealthComponent,
  NameableComponent,
  PrincipalComponent,
} from '../ecs/components';
import { useWorld } from '../context/WorldProvider';
import EntityCard from './EntityCard';
import { fromBaseUnit, getByCanisterId } from '../utils/tokens';

export default function UnitCard() {
  const { unitEntityId, getEntity } = useWorld();

  if (!unitEntityId) {
    return null;
  }

  const entity = getEntity(unitEntityId);
  if (!entity) {
    throw new Error('Entity not found');
  }

  const health = entity.getComponent(HealthComponent);
  if (!health) {
    return null;
  }

  const principal = entity.getComponent(PrincipalComponent);
  if (!principal) {
    throw new Error('Principal component not found');
  }

  const transform = entity.getComponent(ClientTransformComponent);

  const nameabel = entity.getComponent(NameableComponent);
  const name = nameabel?.name || `Unit ${entity.id.toString()}`;

  const hitpoints = Math.round(Number((health.amount / health.max) * 100));

  const fungible = entity.getComponent(FungibleComponent);
  const energyToken = getByCanisterId(
    fungible,
    process.env.CANISTER_ID_ENERGY_LEDGER_CANISTER!,
  );

  const tokens = fromBaseUnit(
    energyToken?.amount || 0n,
    energyToken?.decimals || 0,
  );

  return (
    <EntityCard
      name={name}
      principal={principal.principal}
      hitpoints={hitpoints}
      top={0}
      left={0}
      energyTokens={tokens}
    />
  );
}
