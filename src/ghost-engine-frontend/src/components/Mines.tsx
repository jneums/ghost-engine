import Mine from './Mine';

export default function Mines({ entityIds }: { entityIds: number[] }) {
  const unitComponents = entityIds.map((entityId) => (
    <Mine key={entityId} entityId={entityId} />
  ));

  return unitComponents;
}
