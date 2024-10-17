import * as THREE from 'three';
import { useConnection } from '../context/ConnectionProvider';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { sleep } from '../utils';
import {
  CombatComponent,
  HealthComponent,
  MoveTargetComponent,
  TargetComponent,
  TransformComponent,
} from '../components';
import { useWorld } from '../context/WorldProvider';
import { useErrorMessage } from '../context/ErrorProvider';
import { Principal } from '@dfinity/principal';

export default function useAction() {
  const { identity } = useInternetIdentity();
  const { addComponent, getEntity } = useWorld();
  const { send } = useConnection();
  const { setErrorMessage } = useErrorMessage();

  function attack(entityId: number, targetEntityId: number) {
    if (!identity) {
      throw new Error('Identity not found');
    }

    console.log('Attack action');
    const entity = getEntity(entityId);
    const health = entity.getComponent(HealthComponent);

    const inCombat = entity.getComponent(CombatComponent);
    if (inCombat) {
      setErrorMessage('Already attacking');
      console.error('Already attacking');
      return;
    }

    const isDead = health.amount <= 0;

    if (isDead) {
      setErrorMessage('You are dead');
      console.error('You are dead');
      return;
    }

    const isSelf = entityId === targetEntityId;
    if (isSelf) {
      console.error('Entities cannot attack themselves');
      return;
    }

    const targetEntity = getEntity(targetEntityId);
    const targetHealth = targetEntity.getComponent(HealthComponent);

    const isTargetDead = targetHealth.amount <= 0;
    if (isTargetDead) {
      setErrorMessage('They are already dead');
      console.error('They are already dead');
      return;
    }

    const targetTransform = targetEntity.getComponent(TransformComponent);
    if (!targetTransform) {
      console.error('Player transform not found');
      return;
    }

    const attackerTransform = entity.getComponent(TransformComponent);
    const distance = attackerTransform.position.distanceTo(
      targetTransform.position,
    );
    if (distance > 10) {
      setErrorMessage('You must get closer');
      console.error('You must get closer');
      return;
    }

    // Notify the backend of the action
    send(identity, {
      Attack: {
        entityId: BigInt(entityId),
        targetEntityId: BigInt(targetEntityId),
      },
    });

    // Add the components to the ecs entity
    const combat = new CombatComponent(targetEntityId, 0, 0, 0);

    // Sleep for a bit to reduce perceived latency
    sleep(250).then(() => {
      // Add the components to the ecs entity
      addComponent(entityId, combat);
    });
  }

  function move(entityId: number, waypoints: THREE.Vector3[]) {
    if (!identity) {
      throw new Error('Identity not found');
    }

    console.log('Move action');

    // Notify the backend of the action
    send(identity, {
      Move: {
        entityId: BigInt(entityId),
        waypoints: waypoints,
      },
    });

    sleep(500).then(() => {
      // Add the components to the ecs entity
      const position = new MoveTargetComponent(waypoints);

      // Add the components to the ecs entity
      addComponent(entityId, position);
    });
  }

  function redeem(entityId: number) {
    if (!identity) {
      throw new Error('Identity not found');
    }
    console.log('RedeemTokens action');
    const entity = getEntity(entityId);
    const health = entity.getComponent(HealthComponent);

    const inCombat = entity.getComponent(CombatComponent);
    if (inCombat) {
      setErrorMessage('You cannot do that now');
      console.error('Cannot redeem tokens while in combat');
      return;
    }

    const isDead = health.amount <= 0;

    if (isDead) {
      setErrorMessage('You are dead');
      console.error('Cannot redeem tokens while dead');
      return;
    }

    // Notify the backend of the action
    send(identity, {
      Redeem: {
        entityId: BigInt(entityId),
        to: identity.getPrincipal(),
      },
    });
  }

  function respawn() {
    if (!identity) {
      throw new Error('Identity not found');
    }
    console.log('Move action');

    // Notify the backend of the action
    send(identity, {
      Respawn: {
        principal: identity.getPrincipal(),
      },
    });
  }

  function setTarget(entityId: number, targetEntityId: number) {
    console.log('Set target action');

    // Add the components to the ecs entity
    const target = new TargetComponent(targetEntityId);

    // Add the components to the ecs entity
    addComponent(entityId, target);
  }

  return { attack, move, redeem, respawn, setTarget };
}
