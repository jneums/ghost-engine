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
          x: Math.floor(args.position.x),
          y: Math.floor(args.position.y),
          z: Math.floor(args.position.z),
        },
      },
    });

    // Add the components to the ecs entity
    const position = new MoveTargetComponent(
      new THREE.Vector3(
        Math.floor(args.position.x),
        Math.floor(args.position.y),
        Math.floor(args.position.z),
      ),
    );

    // Sleep for a bit to reduce perceived latency
    sleep(250).then(() => {
      // Add the components to the ecs entity
      this.addComponent(args.entityId, position);
    });
  }
}
