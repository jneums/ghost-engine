import { Card, Stack, Typography } from '@mui/joy';
import { useWorld } from '../context/WorldProvider';
import { MiningComponent, PlaceBlockComponent } from '../ecs/components';
import NoTextSelect from './NoTextSelect';

export default function CastBar() {
  const { getEntity, unitEntityId } = useWorld();

  if (!unitEntityId) {
    return null;
  }

  const mining = getEntity(unitEntityId)?.getComponent(MiningComponent);
  const miningProgress = mining ? mining.progress || 0 : 0;

  const placing = getEntity(unitEntityId)?.getComponent(PlaceBlockComponent);
  const placingProgress = placing ? placing.progress || 0 : 0;

  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      sx={{
        width: '100%',
        position: 'fixed',
        bottom: 128,
        opacity: 0.8,
        p: 1,
        pointerEvents: 'none',
      }}>
      <NoTextSelect>
        {mining && (
          <Card size="sm" variant="soft" sx={{ width: '360px', mb: 1 }}>
            <Typography level="body-sm" textAlign="center">
              Mining Progress
            </Typography>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '20px',
                backgroundColor: '#ccc',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
              <div
                style={{
                  width: `${miningProgress * 100}%`,
                  height: '100%',
                  backgroundColor: 'red',
                  transition: 'width 0.5s ease-in-out', // Smooth transition
                }}
              />
              <Typography
                level="body-xs"
                textColor="common.white"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontWeight: 'md',
                  mixBlendMode: 'difference',
                  textAlign: 'center',
                  width: '100%',
                }}>
                {`${(miningProgress * 100).toFixed(0)}%`}
              </Typography>
            </div>
          </Card>
        )}
        {placing && (
          <Card size="sm" variant="soft" sx={{ width: '360px' }}>
            <Typography level="body-sm" textAlign="center">
              Placing Progress
            </Typography>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '20px',
                backgroundColor: '#ccc',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
              <div
                style={{
                  width: `${placingProgress * 100}%`,
                  height: '100%',
                  backgroundColor: 'green',
                  transition: 'width 0.5s ease-in-out', // Smooth transition
                }}
              />
              <Typography
                level="body-xs"
                textColor="common.white"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontWeight: 'md',
                  mixBlendMode: 'difference',
                  textAlign: 'center',
                  width: '100%',
                }}>
                {`${(placingProgress * 100).toFixed(0)}%`}
              </Typography>
            </div>
          </Card>
        )}
      </NoTextSelect>
    </Stack>
  );
}
