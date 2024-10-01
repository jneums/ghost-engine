import { Principal } from '@dfinity/principal';
import { Connection } from '../connection';
import { World } from '../world';

export default class DisconnectAction {
  constructor(private world: World, private connection: Connection) {}

  public handle(args: { principal: Principal }) {
    console.log('Disconnect action');

    // Notify the backend of the action
    this.connection.send({
      Disconnect: {
        principal: args.principal,
      },
    });
  }
}
