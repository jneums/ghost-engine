import { Principal } from '@dfinity/principal';
import { Connection } from '../connection';
import { World } from '../world';

export default class RespawnAction {
  constructor(private world: World, private connection: Connection) {}

  public handle(args: { principal: Principal }) {
    console.log('Move action');

    // Notify the backend of the action
    this.connection.send({
      Respawn: {
        principal: args.principal,
      },
    });
  }
}
