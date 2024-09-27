import { World } from '../hooks/useWorldState';
import { HealthComponent, NameableComponent, PrincipalComponent } from '.';
import EntityCard from './EntityCard';

export default function PlayerCard({
  world,
  playerEntityId,
}: {
  world: World;
  playerEntityId: number;
}) {
  const entity = world.getEntity(playerEntityId);
  if (!entity) {
    return null;
  }

  const health = entity.getComponent(HealthComponent);
  if (!health) {
    return null;
  }

  const principal = entity.getComponent(PrincipalComponent);
  if (!principal) {
    return null;
  }

  const nameabel = entity.getComponent(NameableComponent);
  const name = nameabel?.name || `Player ${entity.id.toString()}`;

  const hitpoints = Math.round(
    Number((health.health / health.maxHealth) * 100),
  );

  return <EntityCard name={name} hitpoints={hitpoints} bottom={0} left={0} />;
}
