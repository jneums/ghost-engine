import { useMemo } from 'react';
import { TransformComponent } from '../ecs/components';
import { useWorld } from '../context/WorldProvider';
import Unit from './Unit';

export default function OtherUnits() {
  const { unitEntityId, getEntitiesByArchetype } = useWorld();
  const unitEntities = getEntitiesByArchetype([TransformComponent]);

  const unitComponents = useMemo(
    () =>
      unitEntities
        .filter((entityId) => entityId !== unitEntityId)
        .map((entityId) => <Unit key={entityId} entityId={entityId} />),
    [unitEntities],
  );

  return unitComponents;
}
