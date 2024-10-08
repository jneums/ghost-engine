import { Button, Typography } from '@mui/joy';
import RespawnAction from '../actions/respawn';
import { useWorld } from '../context/WorldProvider';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useDialog } from '../context/DialogProvider';
import React, { useEffect } from 'react';
import { getIsPlayerDead, getPlayerEntityId } from '../utils';

export default function Respawn() {
  const { world, connection } = useWorld();
  const { identity } = useInternetIdentity();
  const { closeDialog } = useDialog();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!identity) {
    throw new Error('Identity not found');
  }

  const playerEntityId = getPlayerEntityId(world, identity.getPrincipal());
  const isPlayerDead = identity && getIsPlayerDead(world, playerEntityId);

  useEffect(() => {
    if (!isPlayerDead) {
      closeDialog();
    }
  }, [isPlayerDead]);

  const handleRespawn = () => {
    if (!identity) {
      throw new Error('Identity not found');
    }
    setIsLoading(true);
    const respawnAction = new RespawnAction(world, connection);
    respawnAction.handle({ principal: identity.getPrincipal() });
  };

  return (
    <>
      <Typography level="title-md">
        {isLoading ? 'Respawning...' : 'You have died'}
      </Typography>
      <Button loading={isLoading} onClick={handleRespawn}>
        Respawn
      </Button>
    </>
  );
}
