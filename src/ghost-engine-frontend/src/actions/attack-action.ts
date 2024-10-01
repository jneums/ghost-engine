import {
  CombatComponent,
  HealthComponent,
  TransformComponent,
} from '../components';
import { Connection } from '../connection';
import { sleep } from '../utils';
import { World } from '../world';

export default class AttackAction {
  constructor(
    private world: World,
    private connection: Connection,
    private setErrorMessage: (message: string) => void,
  ) {}

  public handle(args: { entityId: number; targetEntityId: number }) {
    console.log('Attack action');
    const entity = this.world.getEntity(args.entityId);
    const health = entity.getComponent(HealthComponent);

    const inCombat = entity.getComponent(CombatComponent);
    if (inCombat) {
      this.setErrorMessage('Already attacking');
      console.error('Already attacking');
      return;
    }

    const isDead = health.amount <= 0;

    if (isDead) {
      this.setErrorMessage('You are dead');
      console.error('You are dead');
      return;
    }

    const isSelf = args.entityId === args.targetEntityId;
    if (isSelf) {
      console.error('Entities cannot attack themselves');
      return;
    }

    const targetEntity = this.world.getEntity(args.targetEntityId);
    const targetHealth = targetEntity.getComponent(HealthComponent);

    const isTargetDead = targetHealth.amount <= 0;
    if (isTargetDead) {
      this.setErrorMessage('They are already dead');
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
      this.setErrorMessage('You must get closer');
      console.error('You must get closer');
      return;
    }

    // Notify the backend of the action
    this.connection.send({
      Attack: {
        entityId: BigInt(args.entityId),
        targetEntityId: BigInt(args.targetEntityId),
      },
    });

    // Add the components to the ecs entity
    const combat = new CombatComponent(args.targetEntityId, 0, 0, 0);

    // Sleep for a bit to reduce perceived latency
    sleep(250).then(() => {
      // Add the components to the ecs entity
      this.world.addComponent(args.entityId, combat);
    });
  }
}
