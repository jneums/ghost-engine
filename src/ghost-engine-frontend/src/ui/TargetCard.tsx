import {
  HealthComponent,
  NameableComponent,
  TargetComponent,
} from '../ecs/components';
import { useWorld } from '../context/WorldProvider';
import EntityCard from './EntityCard';

export default function TargetCard() {
  const { unitEntityId, getEntity } = useWorld();

  if (!unitEntityId) {
    return null;
  }

  const entity = getEntity(unitEntityId);
  if (!entity) {
    throw new Error('Entity not found');
  }

  const targetComponent = entity.getComponent(TargetComponent);
  if (!targetComponent) {
    return null;
  }

  // get target entity
  const targetEntity = getEntity(targetComponent.targetEntityId);
  if (!targetEntity) {
    throw new Error('Target entity not found');
  }

  const health = targetEntity.getComponent(HealthComponent);

  const nameable = targetEntity.getComponent(NameableComponent);
  const name = nameable?.name || `Unit ${targetEntity.id.toString()}`;

  const hitpoints = health
    ? Math.round(Number((health.amount / health.max) * 100))
    : 0;

  return <EntityCard name={name} hitpoints={hitpoints} top={0} right={0} />;
}
