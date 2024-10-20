import { Button, Typography } from '@mui/joy';
import { useDialog } from '../context/DialogProvider';
import React, { useEffect } from 'react';
import { useWorld } from '../context/WorldProvider';
import { HealthComponent } from '../ecs/components';
import useAction from '../hooks/useAction';

export default function Respawn() {
  const { getEntity, unitEntityId } = useWorld();
  const { respawn } = useAction();
  const { closeDialog } = useDialog();
  const [isLoading, setIsLoading] = React.useState(false);

  const isUnitDead = unitEntityId
    ? getEntity(unitEntityId).getComponent(HealthComponent).amount <= 0
    : false;

  useEffect(() => {
    if (!isUnitDead) {
      closeDialog();
    }
  }, [isUnitDead]);

  const handleRespawn = () => {
    setIsLoading(true);
    respawn();
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
