import {
  IcrcLedgerCanister,
  IcrcTokenMetadataResponse,
} from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';
import { Stack, Typography } from '@mui/joy';
import { createAgent } from '@dfinity/utils';
import { useInternetIdentity } from 'ic-use-internet-identity';
import React from 'react';
import { fromE8s } from '../utils';
import { useWorld } from '../context/WorldProvider';
import { RedeemTokensComponent } from '.';
import { match, P } from 'ts-pattern';

const icrc1Id = process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER!;
const gameId = process.env.CANISTER_ID_GHOST_ENGINE_BACKEND!;
const host = import.meta.env.VITE_IC_URL;

export default function GameStats() {
  const { world } = useWorld();
  const { identity } = useInternetIdentity();
  const [balance, setBalance] = React.useState(0n);
  const [metadata, setMetadata] = React.useState<IcrcTokenMetadataResponse>([]);

  // Get any redeem token components
  const redeem = world.getEntitiesByArchetype([RedeemTokensComponent]);

  const fetchBalance = async () => {
    if (!identity) {
      console.error('Identity not found');
      return;
    }

    const agent = await createAgent({
      identity,
      host,
      fetchRootKey: process.env.NODE_ENV === 'development',
    });

    const icrc1 = IcrcLedgerCanister.create({
      agent,
      canisterId: Principal.fromText(icrc1Id),
    });

    const gameServer = Principal.fromText(gameId);
    const data = await icrc1.balance({
      owner: gameServer,
    });
    setBalance(data);
  };

  const fetchMetadata = async () => {
    if (!identity) {
      console.error('Identity not found');
      return;
    }

    const agent = await createAgent({
      identity,
      host,
      fetchRootKey: process.env.NODE_ENV === 'development',
    });

    const icrc1 = IcrcLedgerCanister.create({
      agent,
      canisterId: Principal.fromText(icrc1Id),
    });

    console.log('Fetching metadata');

    const metadata = await icrc1.metadata({});

    console.log(metadata);
    setMetadata(metadata);
  };

  React.useEffect(() => {
    fetchBalance();
  }, [identity, redeem.length]);

  React.useEffect(() => {
    fetchMetadata();
  }, [identity]);

  const res = metadata.find(([k, v]) => k === 'icrc1:symbol') ?? ['', ''];
  const symbol = match(res[1])
    .with({ Text: P.select() }, (v) => v)
    .otherwise(() => '');

  return (
    <Stack position="absolute" top={0} left={0} padding={2}>
      <Stack>
        <Typography level="body-sm" sx={{ color: 'black' }}>
          {process.env.CANISTER_ID_GHOST_ENGINE_BACKEND}
        </Typography>
        {symbol && (
          <Typography level="body-xs" sx={{ color: 'black' }}>
            {symbol} {fromE8s(balance)}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}