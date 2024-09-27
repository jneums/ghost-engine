import { World } from '../hooks/useWorldState';
import { HealthComponent, NameableComponent, TargetComponent } from '.';
import EntityCard from './EntityCard';

export default function TargetCard({
  world,
  playerEntityId,
}: {
  world: World;
  playerEntityId: number;
}) {
  const entity = world.getEntity(playerEntityId);
  if (!entity) {
    throw new Error('Entity not found');
  }

  const targetComponent = entity.getComponent(TargetComponent);
  if (!targetComponent) {
    return null;
  }

  // get target entity
  const targetEntity = world.getEntity(targetComponent.targetEntityId);
  if (!targetEntity) {
    throw new Error('Target entity not found');
  }

  const health = targetEntity.getComponent(HealthComponent);

  const nameable = targetEntity.getComponent(NameableComponent);
  const name = nameable?.name || `Player ${targetEntity.id.toString()}`;

  const hitpoints = health
    ? Math.round(Number((health.health / health.maxHealth) * 100))
    : 0;

  return <EntityCard name={name} hitpoints={hitpoints} bottom={0} right={0} />;
}
