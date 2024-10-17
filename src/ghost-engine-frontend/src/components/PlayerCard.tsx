import {
  ClientTransformComponent,
  HealthComponent,
  NameableComponent,
  PrincipalComponent,
} from '.';
import { useWorld } from '../context/WorldProvider';
import EntityCard from './EntityCard';

export default function PlayerCard() {
  const { playerEntityId, getEntity } = useWorld();

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

  const transform = entity.getComponent(ClientTransformComponent);

  const nameabel = entity.getComponent(NameableComponent);
  const name = nameabel?.name || `Player ${entity.id.toString()}`;

  const hitpoints = Math.round(Number((health.amount / health.max) * 100));

  return (
    <EntityCard
      name={name}
      hitpoints={hitpoints}
      top={0}
      left={0}
      coords={transform?.position}
    />
  );
}
