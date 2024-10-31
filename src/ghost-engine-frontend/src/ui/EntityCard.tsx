import * as THREE from 'three';
import {
  Badge,
  Card,
  Chip,
  LinearProgress,
  Stack,
  StackProps,
  Typography,
} from '@mui/joy';
import NoTextSelect from './NoTextSelect';
import { Principal } from '@dfinity/principal';
import CopyId from './CopyId';
import { BoltOutlined, HealthAndSafetyOutlined } from '@mui/icons-material';
import { keyframes } from '@emotion/react';

export default function EntityCard({
  name,
  principal,
  hitpoints,
  energyTokens,
  coords,
  ...stackProps
}: {
  name: string;
  principal: Principal;
  hitpoints: number;
  energyTokens: number; // Total energy tokens
  coords?: THREE.Vector3;
} & StackProps) {
  // Calculate the current energy level
  const energyLevel = Math.floor(energyTokens);
  const energyProgress = (energyTokens % 1) * 100;

  const isOutOfEnergy = energyLevel === 0 && energyProgress < 1;
  const isDead = hitpoints === 0;

  // Define a keyframe animation for blinking
  const blink = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  `;

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
                <Stack direction="row" gap={1}>
                  <Typography
                    level="body-sm"
                    sx={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                    {name}
                  </Typography>
                  <Chip variant="outlined" color="primary" size="sm">
                    {Math.round(Math.sqrt(energyLevel))}x power
                  </Chip>
                </Stack>
              </Stack>
              <Stack direction="row" justifyContent="space-between" gap={0.5}>
                <Typography
                  level="body-xs"
                  sx={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                  {principal.toText()}
                </Typography>
                <CopyId id={principal.toText()} />
              </Stack>
              <Stack direction="row" gap={0.5}>
                <HealthAndSafetyOutlined
                  color={isDead ? ('danger' as 'error') : 'success'}
                  sx={{ fontSize: '18px' }}
                />
                <LinearProgress
                  determinate
                  variant="outlined"
                  color="neutral"
                  thickness={18}
                  value={Number(hitpoints)}
                  sx={{
                    '--LinearProgress-radius': '4px',
                    '--LinearProgress-thickness': '18px',
                  }}>
                  <Typography
                    level="body-xs"
                    textColor="common.white"
                    sx={{ fontWeight: 'md', mixBlendMode: 'difference' }}>
                    {`${hitpoints}%`}
                  </Typography>
                </LinearProgress>
              </Stack>
              <Stack direction="row" gap={0.5}>
                <BoltOutlined
                  color={isOutOfEnergy ? ('danger' as 'error') : 'primary'}
                  sx={{
                    fontSize: '18px',
                    animation: isOutOfEnergy ? `${blink} 2s infinite` : 'none',
                  }}
                />
                <LinearProgress
                  determinate
                  variant="outlined"
                  color={isOutOfEnergy ? 'danger' : 'neutral'}
                  thickness={18}
                  value={energyProgress}
                  sx={{
                    '--LinearProgress-radius': '4px',
                    '--LinearProgress-thickness': '18px',
                  }}>
                  <Typography
                    level="body-xs"
                    textColor={isOutOfEnergy ? 'danger' : 'common.white'}
                    sx={{ fontWeight: 'md', mixBlendMode: 'difference' }}>
                    {energyProgress.toFixed(0)}%
                  </Typography>
                </LinearProgress>
              </Stack>
            </Stack>
          </Stack>
        </Card>
      </NoTextSelect>
    </Stack>
  );
}
