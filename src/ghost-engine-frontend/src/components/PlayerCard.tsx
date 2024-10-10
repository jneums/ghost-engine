import { HealthComponent, NameableComponent, PrincipalComponent } from '.';
import { useWorld } from '../context/WorldProvider';
import EntityCard from './EntityCard';
import { useInternetIdentity } from 'ic-use-internet-identity';

export default function PlayerCard() {
  const { playerEntityId, getEntity } = useWorld();
  const { identity } = useInternetIdentity();
  if (!identity) {
    throw new Error('Identity not found');
  }

  if (!playerEntityId) {
    return null;
  }

  const entity = getEntity(playerEntityId);
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

  const nameabel = entity.getComponent(NameableComponent);
  const name = nameabel?.name || `Player ${entity.id.toString()}`;

  const hitpoints = Math.round(Number((health.amount / health.max) * 100));

  return <EntityCard name={name} hitpoints={hitpoints} bottom={0} left={0} />;
}
