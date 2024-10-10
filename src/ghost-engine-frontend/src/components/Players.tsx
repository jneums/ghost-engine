import { useMemo } from 'react';
import { PrincipalComponent, TransformComponent } from '.';
import Player from './Player';
import { useWorld } from '../context/WorldProvider';

export default function Players() {
  const { getEntitiesByArchetype } = useWorld();
  const playerEntities = getEntitiesByArchetype([
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
