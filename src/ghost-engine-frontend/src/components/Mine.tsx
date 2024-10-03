import { ThreeEvent } from '@react-three/fiber';
import { HealthComponent, TransformComponent } from '.';
import * as THREE from 'three';
import { useRef, useCallback } from 'react';
import AttackAction from '../actions/attack-action';
import SetTargetAction from '../actions/set-target';
import { useWorld } from '../context/WorldProvider';
import { useErrorMessage } from '../context/ErrorProvider';
import { getPlayerEntityId } from '../utils';
import { useInternetIdentity } from 'ic-use-internet-identity';

export default function Mine({ entityId }: { entityId: number }) {
  const { world, connection } = useWorld();
  const { identity } = useInternetIdentity();
  const entity = world.getEntity(entityId);
  const meshRef = useRef<THREE.Mesh>(null);
  const { setErrorMessage } = useErrorMessage();

  if (!entity) return null;

  const serverTransform = entity.getComponent(TransformComponent);
  const health = entity.getComponent(HealthComponent);

  const isDead = health.amount <= 0;
  const color = isDead ? 'black' : 'blue';

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();

      if (!identity) {
        throw new Error('Identity not found');
      }

      const playerEntityId = getPlayerEntityId(world, identity.getPrincipal());

      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      const setTarget = new SetTargetAction(world);
      setTarget.handle({
        entityId: playerEntityId,
        targetEntityId: entityId,
      });

      const attackAction = new AttackAction(world, connection, setErrorMessage);
      attackAction.handle({
        entityId: playerEntityId,
        targetEntityId: entityId,
      });

      console.log('Click on Mine!');
    },
    [world, entityId, connection],
  );

  return (
    <mesh
      ref={meshRef}
      position={[
        serverTransform.position.x,
        serverTransform.position.y,
        serverTransform.position.z,
      ]}
      onClick={handleClick}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial color={color} />
    </mesh>
  );
}
