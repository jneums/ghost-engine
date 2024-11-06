import { useEffect, useMemo } from 'react';
import { TransformComponent } from '../ecs/components';
import { useWorld } from '../context/WorldProvider';
import Unit from './Unit';
import { useGLTF } from '@react-three/drei';

export default function OtherUnits() {
  const { unitEntityId, getEntitiesByArchetype } = useWorld();
  const unitEntities = getEntitiesByArchetype([TransformComponent]);
  const { scene } = useGLTF('unit.glb');
  const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

  useEffect(() => {
    if (scene) {
      scene.rotation.set(0, degreesToRadians(120), 0);
    }
  }, [scene]);

  const unitComponents = useMemo(
    () =>
      unitEntities
        .filter((entityId) => entityId !== unitEntityId)
        .map((entityId) => (
          <Unit key={entityId} entityId={entityId} model={scene} />
        )),
    [unitEntities],
  );

  if (!unitEntityId) {
    return null;
  }

  return (
    <>
      <Unit entityId={unitEntityId} isUserControlled model={scene} />
      {unitComponents}
    </>
  );
}
