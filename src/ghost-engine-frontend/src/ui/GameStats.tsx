import { Principal } from '@dfinity/principal';
import { Card, Stack, Typography } from '@mui/joy';
import { useInternetIdentity } from 'ic-use-internet-identity';
import React from 'react';
import { UnstakeFungibleComponent } from '../ecs/components';
import CopyId from './CopyId';
import { useWorld } from '../context/WorldProvider';
import { getBalance, getMetadata, TokenMetadata } from '../api/icrc';
import { fromBaseUnit } from '../utils/tokens';

const icrc1Id = process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER!;
const gameId = process.env.CANISTER_ID_GHOST_ENGINE_BACKEND!;

export default function GameStats() {
  const { getEntitiesByArchetype } = useWorld();
  const { identity } = useInternetIdentity();
  const [balance, setBalance] = React.useState(0);
  const [metadata, setMetadata] = React.useState<TokenMetadata | null>(null);

  // Get any redeem token components
  const redeem = getEntitiesByArchetype([UnstakeFungibleComponent]);

  const fetchBalance = async () => {
    if (!identity) {
      console.error('Identity not found');
      return;
    }

    const data = await getBalance(identity, Principal.fromText(gameId));

    setBalance(fromBaseUnit(data, decimals));
    console.log('Game balance:', data);
  };

  const fetchMetadata = async () => {
    if (!identity) {
      console.error('Identity not found');
      return;
    }

    const metadata = await getMetadata(identity, Principal.fromText(icrc1Id));
    setMetadata(metadata);
  };

  React.useEffect(() => {
    fetchBalance();
  }, [identity, redeem.length]);

  React.useEffect(() => {
    fetchMetadata();
  }, [identity]);

  if (!metadata) {
    return null;
  }

  const symbol = metadata['icrc1:symbol'];
  const decimals = Number(metadata['icrc1:decimals']);

  return (
    <Stack position="absolute" top={0} left={0} padding={2}>
      <Card size="sm" variant="soft" sx={{ gap: 0 }}>
        <Typography level="body-xs">{symbol || 'Loading...'}</Typography>
        <Stack direction="row" gap={1} justifyContent="flex-end">
          <Typography maxWidth="200px" noWrap level="body-xs">
            {process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER! || 'Unknown'}
          </Typography>
          <CopyId id={process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER! || ''} />
        </Stack>
      </Card>
    </Stack>
  );
}
