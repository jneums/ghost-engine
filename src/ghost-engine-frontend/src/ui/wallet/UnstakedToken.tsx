import {
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Stack,
  Typography,
} from '@mui/joy';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { Send, Sync } from '@mui/icons-material';
import { useWorld } from '../../context/WorldProvider';
import { fromBaseUnit, toBaseUnit } from '../../utils/tokens';
import { useEffect } from 'react';
import {
  FungibleToken,
  StakeFungibleComponent,
  UnstakeFungibleComponent,
} from '../../ecs/components';
import React from 'react';
import {
  approve,
  getBalance,
  getMetadata,
  TokenMetadata,
  transfer,
} from '../../api/icrc';
import useAction from '../../hooks/useAction';
import { Principal } from '@dfinity/principal';
import { WORLD_PRINCIPAL } from '../../utils/principals';

export default function UnstakedToken({
  symbol,
  cid,
  decimals,
}: FungibleToken) {
  const { unitEntityId, getEntity } = useWorld();
  const { stake } = useAction();
  const { identity } = useInternetIdentity();
  const [balance, setBalance] = React.useState(0);
  const [amountToTransfer, setAmountToTransfer] = React.useState(0);
  const [isSending, setIsSending] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isStaking, setIsStaking] = React.useState(false);
  const [isTransferVisible, setIsTransferVisible] = React.useState(false);
  const [to, setTo] = React.useState('');
  const [metadata, setMetadata] = React.useState<TokenMetadata | null>(null);

  if (!identity || !unitEntityId) {
    return null;
  }

  const stakeFungible = getEntity(unitEntityId).getComponent(
    StakeFungibleComponent,
  );

  const unstakeFungible = getEntity(unitEntityId).getComponent(
    UnstakeFungibleComponent,
  );

  useEffect(() => {
    if (!stakeFungible?.startAt) {
      setIsStaking(false);
    }
    if (!unstakeFungible?.startAt) {
      setIsSending(false);
    }
    handleSync();
  }, [stakeFungible, unstakeFungible]);

  useEffect(() => {
    if (!metadata) {
      getMetadata(identity, cid).then(setMetadata);
    }
    handleSync();
  }, [cid]);

  const handleSync = () => {
    setIsSyncing(true);
    getBalance(identity, cid).then((data) => {
      setBalance(fromBaseUnit(data, decimals));
      setIsSyncing(false);
    });
  };

  const handleTransfer = () => {
    const destination = Principal.fromText(to);

    if (amountToTransfer <= 0 || amountToTransfer > balance || !destination) {
      return;
    }
    setIsSending(true);
    const amount = toBaseUnit(amountToTransfer, decimals);
    transfer(identity, cid, destination, amount).then(() => {
      setIsSending(false);
      setAmountToTransfer(0);
    });
  };

  const handleStake = () => {
    if (!metadata) {
      console.error('Metadata (fee) not found');
      return;
    }

    const totalAmount =
      toBaseUnit(amountToTransfer, decimals) + metadata['icrc1:fee'];
    if (totalAmount <= 0 || totalAmount > toBaseUnit(balance, decimals)) {
      console.log('Invalid amount to transfer');
      console.log('amountToTransfer:', totalAmount);
      console.log('balance:', balance);
      return;
    }

    setIsStaking(true);
    approve(identity, WORLD_PRINCIPAL, cid, totalAmount)
      .then(() => {
        stake(unitEntityId, cid, totalAmount - metadata['icrc1:fee']);
        setAmountToTransfer(0);
      })
      .catch((e) => {
        console.error(e);
        setIsStaking(false);
      });
  };

  const toggleTransfer = () => {
    setIsTransferVisible(!isTransferVisible);
  };

  return (
    <Stack gap={1}>
      <FormControl>
        <FormLabel htmlFor="stake">Stake tokens to use them in game</FormLabel>
        <Stack direction="row" justifyContent="space-between" gap={0.5}>
          <Input
            type="number"
            disabled={isSending}
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
              <Stack direction="row" gap={1.5} alignItems="center">
                <Typography level="body-sm">
                  /{' '}
                  {balance.toLocaleString(undefined, {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                  })}
                </Typography>
                <Button
                  loading={isStaking}
                  onClick={handleStake}
                  color="success"
                  variant="soft">
                  Stake
                </Button>
              </Stack>
            }
            fullWidth
          />
          <IconButton loading={isSyncing} onClick={handleSync}>
            <Sync />
          </IconButton>
          <IconButton onClick={toggleTransfer}>
            <Send />
          </IconButton>
        </Stack>
      </FormControl>

      {isTransferVisible && (
        <FormControl>
          <FormLabel htmlFor="stake">Recipient</FormLabel>
          <Stack direction="row" justifyContent="space-between" gap={0.5}>
            <Input
              placeholder="Principal ID"
              disabled={isSending}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              endDecorator={
                <Button
                  loading={isSending}
                  onClick={handleTransfer}
                  color="primary"
                  variant="soft">
                  Send
                </Button>
              }
              fullWidth
            />
          </Stack>
        </FormControl>
      )}

      <Typography level="body-xs">
        ** This token charges a{' '}
        {metadata &&
          fromBaseUnit(metadata['icrc1:fee'], decimals).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 8,
              maximumFractionDigits: 8,
            },
          )}{' '}
        fee for all transactions
      </Typography>
    </Stack>
  );
}
