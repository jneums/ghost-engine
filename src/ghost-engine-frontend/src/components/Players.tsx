import { useMemo } from 'react';
import { PrincipalComponent, TransformComponent } from '.';
import { useWorld } from '../context/WorldProvider';
import Player from './Player';

export default function Players() {
  const { world } = useWorld();
  const playerEntities = world.getEntitiesByArchetype([
    PrincipalComponent,
    TransformComponent,
  ]);

  const unitComponents = useMemo(
    () =>
      playerEntities.map((entityId) => (
        <Player key={entityId} entityId={entityId} />
      )),
    [playerEntities],
  );

  return unitComponents;
}
