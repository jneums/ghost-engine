import { Card, IconButton, Stack, Typography } from '@mui/joy';
import { fromE8s } from '../utils';
import { useWorld } from '../context/WorldProvider';
import { FungibleComponent } from '.';
import { Send } from '@mui/icons-material';
import { useDialog } from '../context/DialogProvider';
import SendTokens from './SendTokens';
import CopyId from './CopyId';

export default function PlayerStats() {
  const { world, playerEntityId, playerPrincipalId } = useWorld();
  const { openDialog } = useDialog();

  if (!playerEntityId) {
    return null;
  }

  // Get any fungible token components
  const entity = world.getEntity(playerEntityId);
  const fungible = entity.getComponent(FungibleComponent);
  const tokens = fungible?.tokens || [];

  const handleSendClick = () => {
    openDialog(<SendTokens />);
  };

  return (
    <Stack position="absolute" bottom="84px" left={0} padding={2}>
      <Card size="sm">
        {tokens.map((token) => (
          <Stack
            key={token.cid.toString()}
            direction="row"
            gap={1}
            justifyContent="space-between">
            <Typography level="body-xs">{token.symbol}</Typography>
            <Stack direction="row" gap={1}>
              <Typography level="body-xs">{fromE8s(token.amount)}</Typography>
              <IconButton
                size="sm"
                sx={{ p: 0, m: 0, minWidth: 0, minHeight: 0 }}
                onClick={handleSendClick}>
                <Send style={{ display: 'block', fontSize: '14px' }} />
              </IconButton>
            </Stack>
          </Stack>
        ))}
        <Stack direction="row" gap={1} justifyContent="flex-end">
          <Typography maxWidth="200px" noWrap level="body-xs">
            {playerPrincipalId?.toText() || 'Unknown'}
          </Typography>
          <CopyId id={playerPrincipalId?.toText() || ''} />
        </Stack>
      </Card>
    </Stack>
  );
}
