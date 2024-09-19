import { match, P } from 'ts-pattern';
import { Data } from '../declarations/ghost-engine-backend/ghost-engine-backend.did';
import { Component } from '../ecs';
import { Principal } from '@dfinity/principal';

export class Vector3 {
  constructor(public x: number, public y: number, public z: number) {}
}

export class Player implements Component {
  constructor(public principal: Principal, public position: Vector3) {}
}

export class Position implements Component {
  constructor(public x: number, public y: number, public z: number) {}
}

export class Velocity implements Component {
  constructor(public x: number, public y: number, public z: number) {}
}

export function getComponent(data: Data) {
  return match(data)
    .with({ Player: P.select() }, (player) => {
      return new Player(
        player.principal,
        new Vector3(
          Number(player.position.x),
          Number(player.position.y),
          Number(player.position.z),
        ),
      );
    })
    .with({ Position: P.select() }, (position) => {
      return new Position(
        Number(position.x),
        Number(position.y),
        Number(position.z),
      );
    })
    .with({ Velocity: P.select() }, (velocity) => {
      return new Velocity(
        Number(velocity.x),
        Number(velocity.y),
        Number(velocity.z),
      );
    })
    .exhaustive();
}
