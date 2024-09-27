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
  constructor(public health: number, public maxHealth: number) {}
}

export class PositionComponent {
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

export class ConnectionComponent {
  constructor(public offline_since: number) {}
}

export class MiningComponent {
  constructor(
    public targetEntityId: number,
    public speed: number,
    public range: number,
    public startAt: number,
  ) {}
}

export class CombatComponent {
  constructor(
    public targetEntityId: number,
    public speed: number,
    public range: number,
    public startAt: number,
  ) {}
}

export class CargoComponent {
  constructor(public capacity: number, public current: number) {}
}

export class ResourceComponent {
  constructor(public amount: number) {}
}

export class NodeSpawningComponent {
  constructor(
    public maxNodes: number,
    public spawnInterval: number,
    public lastSpawn: number,
    public spawnBoundary: {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
    },
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
    .with({ HealthComponent: P.select() }, ({ health, maxHealth }) => {
      return new HealthComponent(Number(health), Number(maxHealth));
    })
    .with({ PositionComponent: P.select() }, ({ position }) => {
      return new PositionComponent(
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
    .with({ ConnectionComponent: P.select() }, ({ offline_since }) => {
      return new ConnectionComponent(Number(offline_since));
    })
    .with(
      { MiningComponent: P.select() },
      ({ targetEntityId, speed, range, startAt }) => {
        return new MiningComponent(
          Number(targetEntityId),
          Number(speed),
          Number(range),
          Number(startAt),
        );
      },
    )
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
    .with({ CargoComponent: P.select() }, ({ capacity, current }) => {
      return new CargoComponent(Number(capacity), Number(current));
    })
    .with({ ResourceComponent: P.select() }, ({ amount }) => {
      return new ResourceComponent(Number(amount));
    })
    .with(
      { NodeSpawningComponent: P.select() },
      ({ maxNodes, spawnInterval, lastSpawn, spawnBoundary }) => {
        return new NodeSpawningComponent(
          Number(maxNodes),
          Number(spawnInterval),
          Number(lastSpawn),
          {
            minX: Number(spawnBoundary.minX),
            maxX: Number(spawnBoundary.maxX),
            minZ: Number(spawnBoundary.minZ),
            maxZ: Number(spawnBoundary.maxZ),
          },
        );
      },
    )
    .exhaustive();
}

export const ComponentConstructors: Record<string, Function> = {
  PrincipalComponent: PrincipalComponent,
  PositionComponent: PositionComponent,
  VelocityComponent: VelocityComponent,
  TransformComponent: TransformComponent,
  ConnectionComponent: ConnectionComponent,
  MiningComponent: MiningComponent,
  CargoComponent: CargoComponent,
  NodeSpawningComponent: NodeSpawningComponent,
  ResourceComponent: ResourceComponent,
};
