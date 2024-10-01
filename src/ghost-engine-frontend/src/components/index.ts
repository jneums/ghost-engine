import * as THREE from 'three';
import { match, P } from 'ts-pattern';
import { Principal } from '@dfinity/principal';
import { Component } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';

export class PrincipalComponent {
  constructor(public principal: Principal) {}
}

export class NameableComponent {
  constructor(public name: string) {}
}

export class HealthComponent {
  constructor(public amount: number, public max: number) {}
}

export class MoveTargetComponent {
  constructor(public position: THREE.Vector3) {}
}

export class VelocityComponent {
  constructor(public velocity: THREE.Vector3) {}
}

export class TransformComponent {
  constructor(
    public position: THREE.Vector3,
    public rotation: THREE.Quaternion,
    public scale: THREE.Vector3,
  ) {}
}

export class OfflineTransformComponent {
  constructor(
    public position: THREE.Vector3,
    public rotation: THREE.Quaternion,
    public scale: THREE.Vector3,
  ) {}
}

export class ConnectionComponent {
  constructor(public offlineSince: number) {}
}

export class DamageComponent {
  constructor(public entityId: number, public amount: number) {}
}

export class CombatComponent {
  constructor(
    public targetEntityId: number,
    public speed: number,
    public range: number,
    public startAt: number,
  ) {}
}

export class FungibleComponent {
  constructor(
    public tokens: { cid: Principal; symbol: string; amount: bigint }[],
  ) {}
}

export class ResourceComponent {
  constructor(public resourceType: string) {}
}

export class RespawnComponent {
  constructor(public duration: number, public deathTime: number) {}
}

export class RedeemTokensComponent {
  constructor(
    public startAt: number,
    public duration: number,
    public to: Principal,
  ) {}
}

// Client side only
export class ClientTransformComponent {
  constructor(
    public position: THREE.Vector3,
    public rotation: THREE.Quaternion,
    public scale: THREE.Vector3,
  ) {}
}

export class TargetComponent {
  constructor(public targetEntityId: number) {}
}

export function createComponentClass(data: Component) {
  return match(data)
    .with({ PrincipalComponent: P.select() }, ({ principal }) => {
      return new PrincipalComponent(principal);
    })
    .with({ NameableComponent: P.select() }, ({ name }) => {
      return new NameableComponent(name);
    })
    .with({ HealthComponent: P.select() }, ({ amount, max }) => {
      return new HealthComponent(Number(amount), Number(max));
    })
    .with({ MoveTargetComponent: P.select() }, ({ position }) => {
      return new MoveTargetComponent(
        new THREE.Vector3(position.x, position.y, position.z),
      );
    })
    .with({ VelocityComponent: P.select() }, ({ velocity }) => {
      return new VelocityComponent(
        new THREE.Vector3(velocity.x, velocity.y, velocity.z),
      );
    })
    .with(
      { TransformComponent: P.select() },
      ({ position, rotation, scale }) => {
        return new TransformComponent(
          new THREE.Vector3(position.x, position.y, position.z),
          new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
          new THREE.Vector3(scale.x, scale.y, scale.z),
        );
      },
    )
    .with(
      { OfflineTransformComponent: P.select() },
      ({ position, rotation, scale }) => {
        return new OfflineTransformComponent(
          new THREE.Vector3(position.x, position.y, position.z),
          new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
          new THREE.Vector3(scale.x, scale.y, scale.z),
        );
      },
    )
    .with({ ConnectionComponent: P.select() }, ({ offlineSince }) => {
      return new ConnectionComponent(Number(offlineSince));
    })
    .with(
      { CombatComponent: P.select() },
      ({ targetEntityId, speed, range, startAt }) => {
        return new CombatComponent(
          Number(targetEntityId),
          Number(speed),
          Number(range),
          Number(startAt),
        );
      },
    )
    .with({ FungibleComponent: P.select() }, ({ tokens }) => {
      return new FungibleComponent(tokens);
    })
    .with({ ResourceComponent: P.select() }, ({ resourceType }) => {
      return new ResourceComponent(resourceType);
    })
    .with({ RespawnComponent: P.select() }, ({ duration, deathTime }) => {
      return new RespawnComponent(Number(duration), Number(deathTime));
    })
    .with({ DamageComponent: P.select() }, ({ sourceEntityId, amount }) => {
      return new DamageComponent(Number(sourceEntityId), Number(amount));
    })
    .with(
      { RedeemTokensComponent: P.select() },
      ({ startAt, duration, to }) => {
        return new RedeemTokensComponent(Number(startAt), Number(duration), to);
      },
    )
    .exhaustive();
}

export const ComponentConstructors: Record<string, Function> = {
  PrincipalComponent: PrincipalComponent,
  MoveTargetComponent: MoveTargetComponent,
  VelocityComponent: VelocityComponent,
  TransformComponent: TransformComponent,
  ConnectionComponent: ConnectionComponent,
  DamageComponent: DamageComponent,
  FungibleComponent: FungibleComponent,
  RespawnComponent: RespawnComponent,
  ResourceComponent: ResourceComponent,
  CombatComponent: CombatComponent,
  HealthComponent: HealthComponent,
  RedeemTokensComponent: RedeemTokensComponent,
};
