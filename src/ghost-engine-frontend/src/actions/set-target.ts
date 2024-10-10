import { TargetComponent } from '../components';
import { Component } from '../ecs';

export default class SetTargetAction {
  constructor(
    private addComponent: (entityId: number, component: Component) => void,
  ) {}

  public handle(args: { entityId: number; targetEntityId: number }) {
    console.log('Set target action');

    // Add the components to the ecs entity
    const target = new TargetComponent(args.targetEntityId);

    // Add the components to the ecs entity
    this.addComponent(args.entityId, target);
  }
}
