import * as THREE from 'three';
import { MoveTargetComponent } from '../components';
import { sleep } from '../utils';
import { Component } from '../ecs';
import { Action } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';

export default class MoveAction {
  constructor(
    private addComponent: (entityId: number, component: Component) => void,
    private send: (action: Action) => void,
  ) {}

  public handle(args: { entityId: number; position: THREE.Vector3 }) {
    console.log('Move action');

    // Notify the backend of the action
    this.send({
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
    const position = new MoveTargetComponent(args.position);

    // Sleep for a bit to reduce perceived latency
    sleep(250).then(() => {
      // Add the components to the ecs entity
      this.addComponent(args.entityId, position);
    });
  }
}
