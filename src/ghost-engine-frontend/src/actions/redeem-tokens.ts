import { Principal } from '@dfinity/principal';
import { CombatComponent, HealthComponent } from '../components';
import { Connection } from '../connection';
import { World } from '../world';

export default class RedeemTokensAction {
  constructor(
    private world: World,
    private connection: Connection,
    private setErrorMessage: (message: string) => void,
  ) {}

  public handle(args: { entityId: number; principal: Principal }) {
    console.log('RedeemTokens action');
    const entity = this.world.getEntity(args.entityId);
    const health = entity.getComponent(HealthComponent);

    const inCombat = entity.getComponent(CombatComponent);
    if (inCombat) {
      this.setErrorMessage('You cannot do that now');
      console.error('Cannot redeem tokens while in combat');
      return;
    }

    const isDead = health.amount <= 0;

    if (isDead) {
      this.setErrorMessage('You are dead');
      console.error('Cannot redeem tokens while dead');
      return;
    }

    // Notify the backend of the action
    this.connection.send({
      Redeem: {
        entityId: BigInt(args.entityId),
        to: args.principal,
      },
    });
  }
}
