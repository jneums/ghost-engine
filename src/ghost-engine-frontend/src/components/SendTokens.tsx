import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Typography,
} from '@mui/joy';
import { useWorld } from '../context/WorldProvider';
import { useDialog } from '../context/DialogProvider';
import RedeemTokensAction from '../actions/redeem-tokens';
import React from 'react';
import { Principal } from '@dfinity/principal';
import { useErrorMessage } from '../context/ErrorProvider';
import { getPlayerEntityId } from '../utils';
import { useInternetIdentity } from 'ic-use-internet-identity';

export default function SendTokens() {
  const { world, connection } = useWorld();
  const { identity } = useInternetIdentity();
  const { closeDialog } = useDialog();
  const [principalId, setPrincipalId] = React.useState('');
  const { setErrorMessage } = useErrorMessage();

  if (!identity) {
    throw new Error('Identity not found');
  }

  const handleRedeemTokens = () => {
    console.log('Redeem tokens');
    const playerEntityId = getPlayerEntityId(world, identity.getPrincipal());
    if (!playerEntityId) {
      console.error('Player id not found');
      return;
    }

    const principal = Principal.fromText(principalId);

    const redeemTokensAction = new RedeemTokensAction(
      world,
      connection,
      setErrorMessage,
    );
    redeemTokensAction.handle({
      entityId: playerEntityId,
      principal,
    });
    closeDialog();
  };

  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Typography level="title-md">Transfer your tokens</Typography>

        <FormControl>
          <FormLabel htmlFor="principal">Principal</FormLabel>
          <Input
            id="principal"
            placeholder='e.g. "rwlgt-iiaaa-aaaaa-aaaaa-cai"'
            value={principalId}
            onChange={(e) => setPrincipalId(e.target.value)}
          />
        </FormControl>
      </Stack>
      <Stack direction="row" justifyContent="flex-end" gap={1}>
        <Button variant="outlined" color="neutral" onClick={closeDialog}>
          Cancel
        </Button>
        <Button onClick={handleRedeemTokens}>Send</Button>
      </Stack>
    </Stack>
  );
}
