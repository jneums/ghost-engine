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

export const Archetype = {
  Player: new Set([PrincipalComponent, TransformComponent]),
  MovingPlayer: new Set([
    PrincipalComponent,
    TransformComponent,
    VelocityComponent,
  ]),
  StaticObject: new Set([TransformComponent]),
};

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
    .with(
      { TransformComponent: P.select() },
      ({ position, rotation, scale }) => {
        return new TransformComponent(
          new THREE.Vector3(
            Number(position.x),
            Number(position.y),
            Number(position.z),
          ),
          new THREE.Quaternion(
            Number(rotation.x),
            Number(rotation.y),
            Number(rotation.z),
            Number(rotation.w),
          ),
          new THREE.Vector3(Number(scale.x), Number(scale.y), Number(scale.z)),
        );
      },
    )
    .exhaustive();
}
