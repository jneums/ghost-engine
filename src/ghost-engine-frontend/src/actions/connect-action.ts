import { Principal } from '@dfinity/principal';
import { Action } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';

export default class ConnectAction {
  constructor(private send: (action: Action) => void) {}

  public handle(args: { principal: Principal }) {
    console.log('Connect action');

    // Notify the backend of the action
    this.send({
      Connect: {
        principal: args.principal,
      },
    });
  }
}
