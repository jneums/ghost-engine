import { Card, IconButton, Stack, Typography } from '@mui/joy';
import { fromE8s } from '../utils';
import { useWorld } from '../context/WorldProvider';
import { FungibleComponent, RedeemTokensComponent } from '.';
import { Send } from '@mui/icons-material';
import { useDialog } from '../context/DialogProvider';
import SendTokens from './SendTokens';
import { useEffect } from 'react';
import React from 'react';

export default function PlayerStats() {
  const { world, playerEntityId } = useWorld();
  const { openDialog } = useDialog();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!playerEntityId) {
    return null;
  }

  // Get any fungible token components
  const entity = world.getEntity(playerEntityId);
  const fungible = entity.getComponent(FungibleComponent);
  const tokens = fungible?.tokens || [];

  const redeem = entity.getComponent(RedeemTokensComponent);

  useEffect(() => {
    if (redeem) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [redeem]);

  const handleSendClick = () => {
    openDialog(<SendTokens />);
  };

  if (!tokens.length) {
    return null;
  }

  return (
    <Stack position="absolute" bottom="76px" left={0} padding={2}>
      <Card size="sm" variant="soft">
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
                disabled={isLoading}
                size="sm"
                sx={{ p: 0, m: 0, minWidth: 0, minHeight: 0 }}
                onClick={handleSendClick}>
                <Send style={{ display: 'block', fontSize: '14px' }} />
              </IconButton>
            </Stack>
          </Stack>
        ))}
      </Card>
    </Stack>
  );
}
