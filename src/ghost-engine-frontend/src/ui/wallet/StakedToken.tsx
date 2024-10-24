import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Typography,
} from '@mui/joy';
import { useWorld } from '../../context/WorldProvider';
import { FungibleToken, UnstakeFungibleComponent } from '../../ecs/components';
import { fromBaseUnit, toBaseUnit } from '../../utils/tokens';
import useAction from '../../hooks/useAction';
import React, { useEffect } from 'react';

export default function StakedToken({
  symbol,
  cid,
  amount,
  decimals,
}: FungibleToken) {
  const { getEntity, unitEntityId } = useWorld();
  const { redeem } = useAction();
  const [amountToTransfer, setAmountToTransfer] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  if (!unitEntityId) {
    return null;
  }

  const transferFungible = getEntity(unitEntityId).getComponent(
    UnstakeFungibleComponent,
  );

  useEffect(() => {
    if (!transferFungible?.startAt) {
      setLoading(false);
    }
  }, [transferFungible]);

  const handleUnstake = () => {
    if (
      amountToTransfer <= 0 ||
      toBaseUnit(amountToTransfer, decimals) > amount
    ) {
      console.log('Invalid amount to transfer');
      console.log('amountToTransfer:', amountToTransfer);
      console.log('amount:', amount);
      return;
    }
    setLoading(true);
    redeem(unitEntityId, cid, toBaseUnit(amountToTransfer, decimals));
    setAmountToTransfer(0);
  };

  return (
    <Stack gap={1}>
      <FormControl>
        <FormLabel htmlFor="stake">
          Unstake tokens to remove from game
        </FormLabel>
        <Input
          type="number"
          disabled={loading}
          value={amountToTransfer.toString()}
          onChange={(e) => setAmountToTransfer(Number(e.target.value))}
          sx={{
            '& input': { textAlign: 'right' },
          }}
          startDecorator={
            <Typography
              level="body-sm"
              textTransform="uppercase"
              fontWeight="md">
              {symbol}
            </Typography>
          }
          endDecorator={
            <Stack direction="row" gap={2} alignItems="center">
              <Typography level="body-sm">
                /{' '}
                {fromBaseUnit(amount, decimals).toLocaleString(undefined, {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                })}
              </Typography>
              <Button
                loading={loading}
                onClick={handleUnstake}
                color="warning"
                variant="soft">
                Unstake
              </Button>
            </Stack>
          }
          fullWidth
        />
      </FormControl>

      <Typography level="body-xs">
        *** You will permantly lose any tokens that are lost or placed in the
        game
      </Typography>
    </Stack>
  );
}
