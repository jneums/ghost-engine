import { Connection } from '../connection';
import { MiningComponent } from '../components';
import { sleep } from '../utils';
import { World } from '../hooks/useWorldState';

export default class MineAction {
  constructor(private world: World, private connection: Connection) {}

  public handle(args: { entityId: number; targetEntityId: number }) {
    console.log('Mine action');

    // Notify the backend of the action
    this.connection.send({
      Mine: {
        entityId: BigInt(args.entityId),
        targetEntityId: BigInt(args.targetEntityId),
      },
    });

    // Add the components to the ecs entity
    const mining = new MiningComponent(args.targetEntityId, 0, 0, 0);

    // Sleep for a bit to reduce perceived latency
    sleep(250).then(() => {
      // Add the components to the ecs entity
      this.world.addComponent(args.entityId, mining);
    });
  }
}
