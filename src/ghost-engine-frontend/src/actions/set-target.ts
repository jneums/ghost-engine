import { TargetComponent } from '../components';
import { World } from '../world';

export default class SetTargetAction {
  constructor(private world: World) {}

  public handle(args: { entityId: number; targetEntityId: number }) {
    console.log('Set target action');

    // Add the components to the ecs entity
    const target = new TargetComponent(args.targetEntityId);

    // Add the components to the ecs entity
    this.world.addComponent(args.entityId, target);
  }
}
