import { Principal } from '@dfinity/principal';
import { Action } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';

export default class DisconnectAction {
  constructor(private send: (action: Action) => void) {}

  public handle(args: { principal: Principal }) {
    console.log('Disconnect action');

    // Notify the backend of the action
    this.send({
      Disconnect: {
        principal: args.principal,
      },
    });
  }
}
