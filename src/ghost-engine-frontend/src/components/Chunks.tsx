import { useMemo } from 'react';
import { PlayerChunksComponent } from '.';
import { useWorld } from '../context/WorldProvider';
import Chunk from './Chunk';
import { getPlayerEntityId } from '../utils';
import { useInternetIdentity } from 'ic-use-internet-identity';

export default function Chunks() {
  const { world } = useWorld();
  const { identity } = useInternetIdentity();
  if (!identity) {
    throw new Error('Identity not found');
  }

  const playerEntityId = getPlayerEntityId(world, identity.getPrincipal());
  if (!playerEntityId) {
    throw new Error('Player entity not found');
  }

  const entity = world.getEntity(playerEntityId);
  if (!entity) {
    return null;
  }

  const chunks = entity.getComponent(PlayerChunksComponent);

  const unitComponents = useMemo(
    () =>
      chunks.chunks.map((chunkPos, idx) => (
        <Chunk key={idx} x={chunkPos.x} z={chunkPos.z} />
      )),
    [chunks.chunks],
  );

  return unitComponents;
}
