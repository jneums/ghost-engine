import * as THREE from 'three';
import { match, P } from 'ts-pattern';
import { Principal } from '@dfinity/principal';
import { Component } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';

export class PrincipalComponent {
  constructor(public principal: Principal) {}
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

export class ClientTransformComponent {
  constructor(
    public position: THREE.Vector3,
    public rotation: THREE.Quaternion,
    public scale: THREE.Vector3,
  ) {}
}

export class ConnectionComponent {
  constructor(public offline_since: number) {}
}

export function createComponentClass(data: Component) {
  return match(data)
    .with({ PrincipalComponent: P.select() }, ({ principal }) => {
      return new PrincipalComponent(principal);
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
    .exhaustive();
}
