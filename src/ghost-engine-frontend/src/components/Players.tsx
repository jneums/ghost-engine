import Player from './Player';

export default function Players({ entityIds }: { entityIds: number[] }) {
  const unitComponents = entityIds.map((entityId) => (
    <Player key={entityId} entityId={entityId} />
  ));

  return unitComponents;
}
