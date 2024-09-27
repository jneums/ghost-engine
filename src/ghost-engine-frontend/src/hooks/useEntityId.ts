import { useEffect, useState } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { EntityId, World } from './useWorldState';
import { findPlayersEntityId } from '../utils';

export const useEntityId = (world: World): EntityId | undefined => {
  const { identity } = useInternetIdentity();
  const [entityId, setEntityId] = useState<EntityId>();

  useEffect(() => {
    if (identity) {
      const entityId = findPlayersEntityId(
        Array.from(world.state.entities.values()),
        identity.getPrincipal(),
      );
      setEntityId(entityId);
    }
  }, [identity, world]);

  return entityId;
};
