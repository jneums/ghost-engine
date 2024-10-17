import * as THREE from 'three';
import { Card, LinearProgress, Stack, StackProps, Typography } from '@mui/joy';
import NoTextSelect from './NoTextSelect';

export default function EntityCard({
  name,
  hitpoints,
  coords,
  ...stackProps
}: {
  name: string;
  hitpoints: number;
  coords?: THREE.Vector3;
} & StackProps) {
  return (
    <Stack
      position="absolute"
      padding={1}
      maxWidth="50%"
      width="320px"
      {...stackProps}>
      <NoTextSelect>
        <Card size="sm" variant="soft" sx={{ opacity: 0.8 }}>
          <Stack
            width="100%"
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={2}>
            <Stack justifyContent="space-between" gap={1} width="100%">
              <Stack direction="row" justifyContent="space-between">
                <Typography
                  level="body-xs"
                  sx={{
                    // clamp to 1 line
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                  {name}
                </Typography>
                <Typography level="body-xs">
                  {coords &&
                    `(${coords
                      .toArray()
                      .map((n) => n.toFixed(0))
                      .join(', ')})`}
                </Typography>
              </Stack>
              <LinearProgress
                determinate
                variant="outlined"
                color="neutral"
                thickness={22}
                value={Number(hitpoints)}
                sx={{
                  '--LinearProgress-radius': '4px',
                  '--LinearProgress-thickness': '22px',
                }}>
                <Typography
                  level="body-xs"
                  textColor="common.white"
                  sx={{ fontWeight: 'md', mixBlendMode: 'difference' }}>
                  HP {`${hitpoints}%`}
                </Typography>
              </LinearProgress>
            </Stack>
          </Stack>
        </Card>
      </NoTextSelect>
    </Stack>
  );
}
