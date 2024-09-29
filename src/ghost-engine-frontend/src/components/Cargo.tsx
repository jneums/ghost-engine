import { CargoComponent } from '.';
import { Button, Card, Stack, Tooltip, Typography } from '@mui/joy';
import { HelpOutline, Send } from '@mui/icons-material';
import { useWorld } from '../context/WorldProvider';

export default function Cargo() {
  const { world, playerEntityId } = useWorld();

  if (!playerEntityId) {
    return null;
  }

  const entity = world.getEntity(playerEntityId);
  if (!entity) {
    return null;
  }

  const cargo = entity.getComponent(CargoComponent);
  if (!cargo) {
    return null;
  }

  return (
    <Stack position="absolute" top={0} right={0} padding={2}>
      <Card size="sm">
        <Stack direction="row" alignItems="baseline" gap={1}>
          <Typography level="title-md" fontSize={'2rem'}>
            {cargo.current}/{cargo.capacity}
          </Typography>
          <Typography level="title-md" color="primary" fontSize={'1.4rem'}>
            tGENG
          </Typography>
          <Tooltip title="These tokens are for testing purposes only!!">
            <HelpOutline sx={{ '&:hover': { cursor: 'help' } }} />
          </Tooltip>
        </Stack>
        <Button variant="outlined" startDecorator={<Send />}>
          Transfer
        </Button>
      </Card>
    </Stack>
  );
}
