import { Button, Typography } from '@mui/joy';
import RespawnAction from '../actions/respawn';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useDialog } from '../context/DialogProvider';
import React, { useEffect } from 'react';
import { useWorld } from '../context/WorldProvider';
import { useConnection } from '../context/ConnectionProvider';

export default function Respawn() {
  const { getPlayerEntityId, getIsPlayerDead } = useWorld();
  const { send } = useConnection();
  const { identity } = useInternetIdentity();
  const { closeDialog } = useDialog();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!identity) {
    throw new Error('Identity not found');
  }

  const playerEntityId = getPlayerEntityId(identity.getPrincipal());
  const isPlayerDead = identity && getIsPlayerDead(playerEntityId);

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
    const respawnAction = new RespawnAction(send);
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
