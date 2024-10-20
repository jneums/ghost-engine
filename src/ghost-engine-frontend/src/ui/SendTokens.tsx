import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Typography,
} from '@mui/joy';
import { useDialog } from '../context/DialogProvider';
import React from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import useAction from '../hooks/useAction';

export default function SendTokens() {
  const { unitEntityId } = useWorld();
  const { redeem } = useAction();
  const { identity } = useInternetIdentity();
  const { closeDialog } = useDialog();
  const [principalId, setPrincipalId] = React.useState('');

  if (!identity) {
    throw new Error('Identity not found');
  }

  const handleRedeemTokens = () => {
    console.log('Redeem tokens');
    if (!unitEntityId) {
      console.error('Unit id not found');
      return;
    }

    redeem(unitEntityId);
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
