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
  constructor(public waypoints: THREE.Vector3[]) {}
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

export class ConnectComponent {
  constructor() {}
}

export class DisconnectComponent {
  constructor(public startAt: number, public duration: number) {}
}

export class SessionComponent {
  constructor(public lastAction: number) {}
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

export class MiningComponent {
  constructor(
    public position: THREE.Vector3,
    public speed: number,
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

export class PlayerViewComponent {
  constructor(public viewRadius: number) {}
}

export class UpdatePlayerChunksComponent {
  constructor() {}
}

export interface PlayersChunk {
  chunkId: THREE.Vector3;
  updatedAt: number;
}
export class PlayerChunksComponent {
  constructor(public chunks: PlayersChunk[]) {}
}

export class BlocksComponent {
  constructor(
    public seed: number,
    public blockData: (Uint8Array | number[])[],
    public chunkPositions: THREE.Vector3[],
  ) {}
}

export class UpdateChunksComponent {
  constructor() {}
}

export class UpdateBlocksComponent {
  constructor() {}
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
    .with({ MoveTargetComponent: P.select() }, ({ waypoints }) => {
      return new MoveTargetComponent(
        waypoints.map(
          (waypoint) => new THREE.Vector3(waypoint.x, waypoint.y, waypoint.z),
        ),
      );
    })
    .with({ VelocityComponent: P.select() }, ({ x, y, z }) => {
      return new VelocityComponent(new THREE.Vector3(x, y, z));
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
    .with({ ConnectComponent: P.select() }, () => {
      return new ConnectComponent();
    })
    .with({ DisconnectComponent: P.select() }, ({ startAt, duration }) => {
      return new DisconnectComponent(Number(startAt), Number(duration));
    })
    .with({ SessionComponent: P.select() }, ({ lastAction }) => {
      return new SessionComponent(Number(lastAction));
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
    .with({ MiningComponent: P.select() }, ({ position, speed, startAt }) => {
      return new MiningComponent(
        new THREE.Vector3(position.x, position.y, position.z),
        Number(speed),
        Number(startAt),
      );
    })
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
    .with({ PlayerViewComponent: P.select() }, ({ viewRadius }) => {
      return new PlayerViewComponent(Number(viewRadius));
    })
    .with({ UpdatePlayerChunksComponent: P.select() }, () => {
      return new UpdatePlayerChunksComponent();
    })
    .with({ PlayerChunksComponent: P.select() }, ({ chunks }) => {
      return new PlayerChunksComponent(
        chunks.map(({ chunkId, updatedAt }) => ({
          chunkId: new THREE.Vector3(chunkId.x, chunkId.y, chunkId.z),
          updatedAt: Number(updatedAt / 1_000_000n), // Correct conversion to milliseconds
        })),
      );
    })
    .with(
      { BlocksComponent: P.select() },
      ({ seed, blockData, chunkPositions }) => {
        return new BlocksComponent(
          Number(seed),
          blockData,
          chunkPositions.map((c) => new THREE.Vector3(c.x, c.y, c.z)),
        );
      },
    )
    .with({ UpdateBlocksComponent: P.select() }, () => {
      return new UpdateBlocksComponent();
    })
    .with({ UpdateChunksComponent: P.select() }, () => {
      return new UpdateChunksComponent();
    })
    .exhaustive();
}

export const ComponentConstructors: Record<string, Function> = {
  PrincipalComponent: PrincipalComponent,
  MoveTargetComponent: MoveTargetComponent,
  VelocityComponent: VelocityComponent,
  TransformComponent: TransformComponent,
  ConnectComponent: ConnectComponent,
  DisconnectComponent: DisconnectComponent,
  SessionComponent: SessionComponent,
  DamageComponent: DamageComponent,
  FungibleComponent: FungibleComponent,
  RespawnComponent: RespawnComponent,
  ResourceComponent: ResourceComponent,
  CombatComponent: CombatComponent,
  MiningComponent: MiningComponent,
  HealthComponent: HealthComponent,
  RedeemTokensComponent: RedeemTokensComponent,
  PlayerChunksComponent: PlayerChunksComponent,
  UpdatePlayerChunksComponent: UpdatePlayerChunksComponent,
  PlayerViewComponent: PlayerViewComponent,
};
