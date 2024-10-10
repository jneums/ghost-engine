import { useMemo } from 'react';
import { ResourceComponent, TransformComponent } from '.';
import { useWorld } from '../context/GameProvider';
import Mine from './Mine';

export default function Mines() {
  const { world } = useWorld();
  const mineEntities = world.getEntitiesByArchetype([
    ResourceComponent,
    TransformComponent,
  ]);

  const unitComponents = useMemo(
    () =>
      mineEntities.map((entityId) => (
        <Mine key={entityId} entityId={entityId} />
      )),
    [mineEntities],
  );

  return unitComponents;
}
