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

export class MeshComponent {
  constructor(public mesh: THREE.Mesh) {}
}

export class MaterialComponent {
  constructor(public material: THREE.Material) {}
}

export function createComponentClass(data: Component) {
  return match(data)
    .with({ PrincipalComponent: P.select() }, ({ principal }) => {
      return new PrincipalComponent(principal);
    })
    .with({ PositionComponent: P.select() }, ({ position }) => {
      return new PositionComponent(
        new THREE.Vector3(
          Number(position.x),
          Number(position.y),
          Number(position.z),
        ),
      );
    })
    .with({ VelocityComponent: P.select() }, ({ velocity }) => {
      return new VelocityComponent(
        new THREE.Vector3(
          Number(velocity.x),
          Number(velocity.y),
          Number(velocity.z),
        ),
      );
    })
    .with({ MeshComponent: P.select() }, ({ mesh }) => {
      return new THREE.Mesh();
    })
    .with({ MaterialComponent: P.select() }, ({ material }) => {
      return new THREE.Material();
    })
    .exhaustive();
}
