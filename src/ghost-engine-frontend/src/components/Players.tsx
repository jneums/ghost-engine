import { PrincipalComponent, TransformComponent } from '../components';
import { World } from '../hooks/useWorldState';
import Player from './Player';

export default function Players({ world }: { world: World }) {
  const entities = world.getEntitiesByArchetype([
    PrincipalComponent,
    TransformComponent,
  ]);
  const unitComponents = entities.map((entityId) => (
    <Player key={entityId} entityId={entityId} world={world} />
  ));

  return unitComponents;
}
