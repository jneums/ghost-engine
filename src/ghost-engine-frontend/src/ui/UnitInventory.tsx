import {
  Card,
  IconButton,
  Stack,
  Typography,
  Box,
  AspectRatio,
} from '@mui/joy';
import { Send } from '@mui/icons-material';
import { useDialog } from '../context/DialogProvider';
import SendTokens from './SendTokens';
import { useEffect, MouseEvent } from 'react';
import React from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import NoTextSelect from './NoTextSelect';
import { FungibleComponent, RedeemTokensComponent } from '../ecs/components';
import { fromE8s } from '../utils/tokens';

export default function UnitInventory() {
  const { unitEntityId, getEntity, activeBlock, setActiveBlock } = useWorld();
  const { identity } = useInternetIdentity();
  const { openDialog } = useDialog();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!identity) {
    throw new Error('Identity not found');
  }

  if (!unitEntityId) {
    return null;
  }

  // Get any fungible token components
  const entity = getEntity(unitEntityId);
  const fungible = entity.getComponent(FungibleComponent);
  const redeem = entity.getComponent(RedeemTokensComponent);

  useEffect(() => {
    if (redeem) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [redeem]);

  useEffect(() => {
    if (
      activeBlock &&
      !fungible?.tokens.find((token) => token.blockType === activeBlock)
    ) {
      setActiveBlock(null);
    }
  }, [fungible, activeBlock]);

  const handleSendClick = (e: MouseEvent) => {
    e.stopPropagation();
    openDialog(<SendTokens />, { minWidth: 'sm' });
  };

  const toggleToken = (blockType: number) => {
    if (activeBlock === blockType) {
      setActiveBlock(null);
    } else {
      setActiveBlock(blockType);
    }
  };

  return (
    <Stack position="absolute" bottom={0} left={0}>
      <Stack
        direction="row"
        sx={{
          overflowX: 'auto',
          gap: 1,
          p: 1,
        }}>
        {fungible?.tokens.map((token) => (
          <Card
            key={token.blockType}
            onClick={() => toggleToken(token.blockType)}
            variant={activeBlock === token.blockType ? 'solid' : 'soft'}
            color="primary"
            invertedColors={activeBlock === token.blockType}
            size="sm"
            sx={{ p: 0, opacity: 0.8, '&:hover': { cursor: 'pointer' } }}>
            <NoTextSelect>
              <AspectRatio ratio={1} sx={{ width: '60px' }}>
                <Typography level="body-xs">{token.symbol}</Typography>
                <Typography
                  level="body-xs"
                  sx={{
                    position: 'absolute',
                    padding: 0.5,
                    right: 0,
                  }}>
                  x{fromE8s(token.amount)}
                </Typography>
                <IconButton
                  disabled={isLoading}
                  size="sm"
                  sx={{
                    m: 0.5,
                    p: 0,
                    minWidth: 0,
                    minHeight: 0,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                  }}
                  onClick={(e) => handleSendClick(e)}>
                  <Send style={{ display: 'block', fontSize: '14px' }} />
                </IconButton>
              </AspectRatio>
            </NoTextSelect>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
