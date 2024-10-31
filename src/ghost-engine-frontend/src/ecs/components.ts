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
    public positions: THREE.Vector3[],
    public startAt: number,
    public progress: number,
  ) {}
}

export class PlaceBlockComponent {
  constructor(public position: THREE.Vector3, public tokenCid: Principal) {}
}

export class ImportFungibleComponent {
  constructor(public tokenCid: Principal, public to: Principal) {}
}

export interface FungibleToken {
  cid: Principal;
  symbol: string;
  amount: bigint;
  logo: string;
  name: string;
  decimals: number;
}

export class FungibleComponent {
  constructor(public tokens: FungibleToken[]) {}
}

export class ResourceComponent {
  constructor(public resourceType: string) {}
}

export class RespawnComponent {
  constructor(public duration: number, public deathTime: number) {}
}

export class UnstakeFungibleComponent {
  constructor(
    public startAt: number,
    public duration: number,
    public from: Principal,
    public tokenCid: Principal,
    public amount: number,
  ) {}
}

export class StakeFungibleComponent {
  constructor(
    public startAt: number,
    public duration: number,
    public from: Principal,
    public tokenCid: Principal,
    public amount: number,
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

export class UnitViewComponent {
  constructor(public viewRadius: number) {}
}

export class UpdateUnitChunksComponent {
  constructor() {}
}

export interface UnitsChunk {
  chunkId: THREE.Vector3;
  updatedAt: number;
}
export class UnitChunksComponent {
  constructor(public chunks: UnitsChunk[]) {}
}

export class BlocksComponent {
  constructor(
    public seed: number,
    public blockData: (Uint16Array | number[])[],
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
    .with(
      { PrincipalComponent: P.select() },
      ({ principal }) => new PrincipalComponent(principal),
    )
    .with(
      { NameableComponent: P.select() },
      ({ name }) => new NameableComponent(name),
    )
    .with(
      { HealthComponent: P.select() },
      ({ amount, max }) => new HealthComponent(Number(amount), Number(max)),
    )
    .with(
      { MoveTargetComponent: P.select() },
      ({ waypoints }) =>
        new MoveTargetComponent(
          waypoints.map(
            (waypoint) => new THREE.Vector3(waypoint.x, waypoint.y, waypoint.z),
          ),
        ),
    )
    .with(
      { VelocityComponent: P.select() },
      ({ x, y, z }) => new VelocityComponent(new THREE.Vector3(x, y, z)),
    )
    .with(
      { TransformComponent: P.select() },
      ({ position, rotation, scale }) =>
        new TransformComponent(
          new THREE.Vector3(position.x, position.y, position.z),
          new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
          new THREE.Vector3(scale.x, scale.y, scale.z),
        ),
    )
    .with({ ConnectComponent: P.select() }, () => new ConnectComponent())
    .with(
      { DisconnectComponent: P.select() },
      ({ startAt, duration }) =>
        new DisconnectComponent(Number(startAt), Number(duration)),
    )
    .with(
      { SessionComponent: P.select() },
      ({ lastAction }) => new SessionComponent(Number(lastAction)),
    )
    .with(
      { CombatComponent: P.select() },
      ({ targetEntityId, speed, range, startAt }) =>
        new CombatComponent(
          Number(targetEntityId),
          Number(speed),
          Number(range),
          Number(startAt),
        ),
    )
    .with(
      { MiningComponent: P.select() },
      ({ positions, startAt, progress }) =>
        new MiningComponent(
          positions.map(
            (position) => new THREE.Vector3(position.x, position.y, position.z),
          ),
          Number(startAt),
          Number(progress),
        ),
    )
    .with(
      { FungibleComponent: P.select() },
      ({ tokens }) =>
        new FungibleComponent(
          tokens.map((token) => ({
            cid: Principal.fromText(token.cid),
            symbol: token.symbol,
            amount: token.amount,
            logo: token.logo,
            name: token.name,
            decimals: Number(token.decimals),
          })),
        ),
    )
    .with(
      { ResourceComponent: P.select() },
      ({ resourceType }) => new ResourceComponent(resourceType),
    )
    .with(
      { RespawnComponent: P.select() },
      ({ duration, deathTime }) =>
        new RespawnComponent(Number(duration), Number(deathTime)),
    )
    .with(
      { DamageComponent: P.select() },
      ({ sourceEntityId, amount }) =>
        new DamageComponent(Number(sourceEntityId), Number(amount)),
    )
    .with(
      { StakeFungibleComponent: P.select() },
      ({ startAt, duration, from, tokenCid, amount }) =>
        new StakeFungibleComponent(
          Number(startAt),
          Number(duration),
          from,
          tokenCid,
          Number(amount),
        ),
    )
    .with(
      { UnstakeFungibleComponent: P.select() },
      ({ startAt, duration, to, tokenCid, amount }) =>
        new UnstakeFungibleComponent(
          Number(startAt),
          Number(duration),
          to,
          tokenCid,
          Number(amount),
        ),
    )
    .with(
      { UnitViewComponent: P.select() },
      ({ viewRadius }) => new UnitViewComponent(Number(viewRadius)),
    )
    .with(
      { UpdateUnitChunksComponent: P.select() },
      () => new UpdateUnitChunksComponent(),
    )
    .with(
      { UnitChunksComponent: P.select() },
      ({ chunks }) =>
        new UnitChunksComponent(
          chunks.map(({ chunkId, updatedAt }) => ({
            chunkId: new THREE.Vector3(chunkId.x, chunkId.y, chunkId.z),
            updatedAt: Number(updatedAt / 1_000_000n), // Correct conversion to milliseconds
          })),
        ),
    )
    .with(
      { BlocksComponent: P.select() },
      ({ seed, blockData, chunkPositions }) =>
        new BlocksComponent(
          Number(seed),
          blockData,
          chunkPositions.map((c) => new THREE.Vector3(c.x, c.y, c.z)),
        ),
    )
    .with(
      { UpdateBlocksComponent: P.select() },
      () => new UpdateBlocksComponent(),
    )
    .with(
      { UpdateChunksComponent: P.select() },
      () => new UpdateChunksComponent(),
    )
    .with(
      { PlaceBlockComponent: P.select() },
      ({ position, tokenCid }) =>
        new PlaceBlockComponent(
          new THREE.Vector3(position.x, position.y, position.z),
          tokenCid,
        ),
    )
    .with(
      { ImportFungibleComponent: P.select() },
      ({ tokenCid, to }) => new ImportFungibleComponent(tokenCid, to),
    )

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
  PlaceBlockComponent: PlaceBlockComponent,
  HealthComponent: HealthComponent,
  ImportFungibleComponent: ImportFungibleComponent,
  StakeFungibleComponent: StakeFungibleComponent,
  UnstakeFungibleComponent: UnstakeFungibleComponent,
  UnitChunksComponent: UnitChunksComponent,
  UpdateUnitChunksComponent: UpdateUnitChunksComponent,
  UnitViewComponent: UnitViewComponent,
};
