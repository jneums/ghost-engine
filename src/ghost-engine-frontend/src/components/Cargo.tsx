import { World } from '../hooks/useWorldState';
import { Connection } from '../connection';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { findPlayersEntityId } from '../utils';
import { CargoComponent } from '.';
import { Button, Card, Stack, Tooltip, Typography } from '@mui/joy';
import { Help, HelpOutline, Send } from '@mui/icons-material';

export default function Cargo({
  world,
  connection,
}: {
  world: World;
  connection: Connection;
}) {
  const { identity } = useInternetIdentity();
  if (!identity) {
    return null;
  }

  const playerId = findPlayersEntityId(
    Array.from(world.state.entities.values()),
    identity.getPrincipal(),
  );
  if (!playerId) {
    return null;
  }

  const entity = world.getEntity(playerId);
  if (!entity) {
    return null;
  }

  const cargo = entity.getComponent(CargoComponent);
  if (!cargo) {
    return null;
  }

  return (
    <Stack position="absolute" top={0} right={0} padding={2}>
      <Card>
        <Typography
          level="title-md"
          fontSize={'2.2rem'}
          endDecorator={
            <Tooltip title="Ghost Engine tokens are for testing purposes only and have no real value!!">
              <HelpOutline
                sx={{ width: '24px', '&:hover': { cursor: 'help' } }}
              />
            </Tooltip>
          }>
          {cargo.current}/{cargo.capacity}
          <Typography
            component="span"
            color="primary"
            sx={{ ml: 2 }}
            fontSize={'1.8rem'}>
            tGENG
          </Typography>
        </Typography>
        <Button variant="outlined" startDecorator={<Send />}>
          Transfer
        </Button>
      </Card>
    </Stack>
  );
}
