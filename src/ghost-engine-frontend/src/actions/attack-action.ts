import { CombatComponent } from '../components';
import { Connection } from '../connection';
import { sleep } from '../utils';
import { World } from '../world';

export default class AttackAction {
  constructor(private world: World, private connection: Connection) {}

  public handle(args: { entityId: number; targetEntityId: number }) {
    console.log('Attack action');

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
