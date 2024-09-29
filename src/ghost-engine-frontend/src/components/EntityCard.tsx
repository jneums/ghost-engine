import { Card, LinearProgress, Stack, StackProps, Typography } from '@mui/joy';

export default function EntityCard({
  name,
  hitpoints,
  ...stackProps
}: {
  name: string;
  hitpoints: number;
} & StackProps) {
  return (
    <Stack
      position="absolute"
      padding={2}
      maxWidth="45%"
      width="420px"
      {...stackProps}>
      <Card size="sm">
        <Stack
          width="100%"
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap={2}>
          <Stack justifyContent="space-between" gap={1} width="100%">
            <Typography
              level="body-lg"
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
            <LinearProgress
              determinate
              variant="outlined"
              color="neutral"
              size="sm"
              thickness={24}
              value={Number(hitpoints)}
              sx={{
                '--LinearProgress-radius': '20px',
                '--LinearProgress-thickness': '24px',
              }}>
              <Typography
                level="body-xs"
                textColor="common.white"
                sx={{ fontWeight: 'xl', mixBlendMode: 'difference' }}>
                HP {`${hitpoints}%`}
              </Typography>
            </LinearProgress>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
