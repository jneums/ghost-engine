import { useMemo } from 'react';
import { PlayerChunksComponent } from '.';
import Chunk from './Chunk';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';

export default function Chunks() {
  const { playerEntityId, getEntity } = useWorld();
  const { identity } = useInternetIdentity();
  if (!identity) {
    throw new Error('Identity not found');
  }

  if (!playerEntityId) {
    throw new Error('Player entity not found');
  }

  const entity = getEntity(playerEntityId);
  if (!entity) {
    return null;
  }

  const chunks = entity.getComponent(PlayerChunksComponent);

  const unitComponents = useMemo(
    () =>
      chunks.chunks.map((chunkPos, idx) => (
        <Chunk key={JSON.stringify(chunkPos)} x={chunkPos.x} z={chunkPos.z} />
      )),
    [chunks.chunks],
  );

  return unitComponents;
}
