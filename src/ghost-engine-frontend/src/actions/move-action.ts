import * as THREE from 'three';
import { MoveTargetComponent } from '../components';
import { Component } from '../ecs';
import { Action } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';

export default class MoveAction {
  constructor(
    private addComponent: (entityId: number, component: Component) => void,
    private send: (action: Action) => void,
  ) {}

  public handle(args: { entityId: number; waypoints: THREE.Vector3[] }) {
    console.log('Move action');

    // Notify the backend of the action
    this.send({
      Move: {
        entityId: BigInt(args.entityId),
        waypoints: args.waypoints,
      },
    });

    // Add the components to the ecs entity
    const position = new MoveTargetComponent(args.waypoints);

    // Add the components to the ecs entity
    this.addComponent(args.entityId, position);
  }
}
