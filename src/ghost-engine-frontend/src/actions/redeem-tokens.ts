import { Principal } from '@dfinity/principal';
import { CombatComponent, HealthComponent } from '../components';
import { Entity } from '../utils/entity';
import { Action } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';

export default class RedeemTokensAction {
  constructor(
    private getEntity: (entityId: number) => Entity,
    private send: (action: Action) => void,
    private setErrorMessage: (message: string) => void,
  ) {}

  public handle(args: { entityId: number; principal: Principal }) {
    console.log('RedeemTokens action');
    const entity = this.getEntity(args.entityId);
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
    this.send({
      Redeem: {
        entityId: BigInt(args.entityId),
        to: args.principal,
      },
    });
  }
}
