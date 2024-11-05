import * as THREE from 'three';
import { useConnection } from '../context/ConnectionProvider';
import { useInternetIdentity } from 'ic-use-internet-identity';
import {
  CombatComponent,
  HealthComponent,
  MiningComponent,
  MoveTargetComponent,
  PlaceBlockComponent,
  TargetComponent,
  TransformComponent,
} from '../ecs/components';
import { useWorld } from '../context/WorldProvider';
import { useErrorMessage } from '../context/ErrorProvider';
import { sleep } from '../utils/sleep';
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
      console.error('Unit transform not found');
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

  function mine(entityId: number, position: THREE.Vector3) {
    if (!identity) {
      throw new Error('Identity not found');
    }

    console.log('Mine action');

    // Notify the backend of the action
    send(identity, {
      Mine: {
        entityId: BigInt(entityId),
        position,
      },
    });

    // Add the components to the ecs entity
    const existing = getEntity(entityId).getComponent(MiningComponent);
    const positions = existing ? [...existing.positions, position] : [position];
    const progress = existing ? existing.progress : 0;
    const mining = new MiningComponent(positions, 0, progress);

    // Add the components to the ecs entity
    addComponent(entityId, mining);
  }

  function placeBlock(
    entityId: number,
    position: THREE.Vector3,
    tokenCid: Principal,
  ) {
    if (!identity) {
      throw new Error('Identity not found');
    }

    console.log('Place block action');

    // Notify the backend of the action
    send(identity, {
      PlaceBlock: {
        entityId: BigInt(entityId),
        position,
        tokenCid,
      },
    });

    // Add the components to the ecs entity
    const existing = getEntity(entityId).getComponent(PlaceBlockComponent);
    const positions = existing ? [...existing.positions, position] : [position];
    const tokenCids = existing ? [...existing.tokenCids, tokenCid] : [tokenCid];
    const progress = existing ? existing.progress : 0;
    const placeBlock = new PlaceBlockComponent(positions, tokenCids, progress);

    addComponent(entityId, placeBlock);
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
  }

  function redeem(entityId: number, tokenCid: Principal, amount: bigint) {
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
      UnstakeFungible: {
        entityId: BigInt(entityId),
        to: identity.getPrincipal(),
        token: tokenCid,
        amount,
      },
    });
  }

  function stake(entityId: number, tokenCid: Principal, amount: bigint) {
    if (!identity) {
      throw new Error('Identity not found');
    }
    console.log('Stake action');
    const entity = getEntity(entityId);
    const health = entity.getComponent(HealthComponent);

    const inCombat = entity.getComponent(CombatComponent);
    if (inCombat) {
      setErrorMessage('You cannot do that now');
      console.error('Cannot stake tokens while in combat');
      return;
    }

    const isDead = health.amount <= 0;

    if (isDead) {
      setErrorMessage('You are dead');
      console.error('Cannot stake tokens while dead');
      return;
    }

    // Notify the backend of the action
    send(identity, {
      StakeFungible: {
        entityId: BigInt(entityId),
        from: identity.getPrincipal(),
        token: tokenCid,
        amount: BigInt(amount),
      },
    });
  }

  function importFungible(
    entityId: number,
    tokenCid: Principal,
    to: Principal,
  ) {
    if (!identity) {
      throw new Error('Identity not found');
    }
    console.log('ImportFungible action');

    // Notify the backend of the action
    send(identity, {
      ImportFungible: {
        entityId: BigInt(entityId),
        token: tokenCid,
        to,
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

  return {
    attack,
    mine,
    move,
    importFungible,
    redeem,
    stake,
    respawn,
    setTarget,
    placeBlock,
  };
}
