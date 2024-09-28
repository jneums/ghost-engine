import { useInternetIdentity } from 'ic-use-internet-identity';
import { findPlayersEntityId } from '../utils';
import { CargoComponent, PrincipalComponent } from '.';
import { Button, Card, Stack, Tooltip, Typography } from '@mui/joy';
import { HelpOutline, Send } from '@mui/icons-material';
import { useWorld } from '../context/WorldProvider';

export default function Cargo() {
  const { world } = useWorld();
  const { identity } = useInternetIdentity();
  if (!identity) {
    return null;
  }

  const playerId = findPlayersEntityId(
    world,
    world.getEntitiesByArchetype([PrincipalComponent]),
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
