import {
  Card,
  IconButton,
  Stack,
  Typography,
  Box,
  AspectRatio,
  CardCover,
} from '@mui/joy';
import { Send, Settings } from '@mui/icons-material';
import { useDialog } from '../context/DialogProvider';
import { useEffect, MouseEvent } from 'react';
import React from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import NoTextSelect from './NoTextSelect';
import { FungibleComponent, UnstakeFungibleComponent } from '../ecs/components';
import Wallet from './wallet/Wallet';
import { Principal } from '@dfinity/principal';
import { fromBaseUnit } from '../utils/tokens';

export default function UnitInventory() {
  const {
    unitEntityId,
    getEntity,
    activeBlock,
    setActiveBlock,
    tokenRegistry,
  } = useWorld();
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
  const redeem = entity.getComponent(UnstakeFungibleComponent);

  useEffect(() => {
    if (redeem) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [redeem]);

  const toggleToken = (tokenCid: Principal) => {
    if (activeBlock?.toText() === tokenCid.toText()) {
      setActiveBlock(null);
    } else {
      setActiveBlock(tokenCid);
    }
  };

  const handleWalletClick = () => {
    openDialog(<Wallet />, { minWidth: 'sm' });
  };

  return (
    <Stack position="absolute" bottom={0} left={0}>
      <Stack
        direction="row"
        sx={{
          overflowX: 'auto',
          gap: 0.5,
          p: 1,
        }}>
        {fungible?.tokens.map((token) => (
          <Card
            key={token.cid.toText()}
            onClick={() => toggleToken(token.cid)}
            variant={
              activeBlock?.toText() === token.cid.toText() ? 'solid' : 'soft'
            }
            color={
              activeBlock?.toText() === token.cid.toText()
                ? 'success'
                : 'neutral'
            }
            invertedColors={activeBlock?.toText() === token.cid.toText()}
            size="sm"
            sx={{ p: 0.5, '&:hover': { cursor: 'pointer' } }}>
            <NoTextSelect>
              <AspectRatio ratio={1} sx={{ width: '60px' }}>
                <Stack>
                  {token.logo && (
                    <Box
                      component="img"
                      borderRadius="sm"
                      src={token.logo}
                      alt={token.symbol}
                    />
                  )}
                </Stack>
                <CardCover
                  sx={{
                    borderBottomLeftRadius: '4px',
                    borderBottomRightRadius: '4px',
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0))',
                  }}
                />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{
                    position: 'absolute',
                    width: '100%',
                  }}
                  px={0.5}
                  top={0}>
                  <Typography level="body-xs" textColor="common.white">
                    x{Math.floor(fromBaseUnit(token.amount, token.decimals))}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{
                    position: 'absolute',
                    width: '100%',
                  }}
                  px={0.5}
                  bottom={0}>
                  <Typography level="body-xs" textColor="common.white">
                    {token.symbol}
                  </Typography>
                </Stack>
              </AspectRatio>
            </NoTextSelect>
          </Card>
        ))}
        <IconButton onClick={handleWalletClick} variant="soft">
          <Settings />
        </IconButton>
      </Stack>
    </Stack>
  );
}
