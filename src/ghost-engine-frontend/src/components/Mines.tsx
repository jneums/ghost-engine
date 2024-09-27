import { ResourceComponent, TransformComponent } from '.';
import { Connection } from '../connection';
import { World } from '../hooks/useWorldState';
import Mine from './Mine';

export default function Mines({
  world,
  connection,
}: {
  world: World;
  connection: Connection;
}) {
  const entities = world.getEntitiesByArchetype([
    TransformComponent,
    ResourceComponent,
  ]);
  const unitComponents = entities.map((entityId) => (
    <Mine
      key={entityId}
      entityId={entityId}
      world={world}
      connection={connection}
    />
  ));

  return unitComponents;
}
