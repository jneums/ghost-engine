import { Principal } from '@dfinity/principal';
import { Action } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';

export default class RespawnAction {
  constructor(private send: (action: Action) => void) {}

  public handle(args: { principal: Principal }) {
    console.log('Move action');

    // Notify the backend of the action
    this.send({
      Respawn: {
        principal: args.principal,
      },
    });
  }
}
