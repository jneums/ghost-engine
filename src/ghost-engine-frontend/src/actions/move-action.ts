import * as THREE from 'three';
import { PositionComponent } from '../components';
import { World } from '../ecs';
import { Connection } from '../connection';

export class MoveAction {
  constructor(private world: World, private connection: Connection) {}

  public handle(args: { entityId: number; position: THREE.Vector3 }) {
    console.log('Move action');

    // Notify the backend of the action
    this.connection.send({
      Move: {
        entityId: BigInt(args.entityId),
        position: {
          x: args.position.x,
          y: args.position.y,
          z: args.position.z,
        },
      },
    });

    // Add the components to the ecs entity
    const position = new PositionComponent(args.position);

    // Sleep for 1 second
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    sleep(250).then(() => {
      // Add the components to the ecs entity
      this.world.addComponent(args.entityId, position);
    });
  }
}
