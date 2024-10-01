import { Principal } from '@dfinity/principal';
import { Connection } from '../connection';
import { World } from '../world';

export default class ConnectAction {
  constructor(private world: World, private connection: Connection) {}

  public handle(args: { principal: Principal }) {
    console.log('Connect action');

    // Notify the backend of the action
    this.connection.send({
      Connect: {
        principal: args.principal,
      },
    });
  }
}
