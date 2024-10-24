import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { createAgent } from '@dfinity/utils';
import { fromE8s } from '../utils/tokens';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { Value } from '../declarations/icrc1_ledger_canister/icrc1_ledger_canister.did';
import { match, P } from 'ts-pattern';

const host = import.meta.env.VITE_IC_URL;

export const approve = async (
  identity: Identity,
  spender: Principal,
  canisterId: Principal,
  amount: bigint,
) => {
  const agent = await createAgent({
    identity,
    host,
    fetchRootKey: process.env.NODE_ENV === 'development',
  });

  const icrc1 = IcrcLedgerCanister.create({
    agent,
    canisterId: canisterId,
  });

  const res = await icrc1.approve({
    amount,
    spender: {
      owner: spender,
      subaccount: [],
    },
  });
  return res;
};

export const getBalance = async (identity: Identity, canisterId: Principal) => {
  const agent = await createAgent({
    identity,
    host,
    fetchRootKey: process.env.NODE_ENV === 'development',
  });

  const icrc1 = IcrcLedgerCanister.create({
    agent,
    canisterId: canisterId,
  });

  const data = await icrc1.balance({
    owner: identity.getPrincipal(),
  });

  return data;
};

export interface TokenMetadata {
  'icrc1:symbol': string;
  'icrc1:name': string;
  'icrc1:decimals': bigint;
  'icrc1:fee': bigint;
  'icrc1:logo': string;
}

const parseValue = (value: Value) => {
  return match(value)
    .with({ Int: P.select() }, (int) => int)
    .with({ Map: P.select() }, (map) => map)
    .with({ Nat: P.select() }, (nat) => nat)
    .with({ Nat64: P.select() }, (nat64) => nat64)
    .with({ Blob: P.select() }, (blob) => blob)
    .with({ Text: P.select() }, (text) => text)
    .with({ Array: P.select() }, (array) => array)
    .exhaustive();
};

export const getMetadata = async (
  identity: Identity,
  canisterId: Principal,
) => {
  const agent = await createAgent({
    identity,
    host,
    fetchRootKey: process.env.NODE_ENV === 'development',
  });

  const icrc1 = IcrcLedgerCanister.create({
    agent,
    canisterId,
  });

  const metadata = await icrc1.metadata({});
  const parsedMetadata = metadata.map(([key, value]) => [
    key,
    parseValue(value),
  ]);
  return Object.fromEntries(parsedMetadata) as unknown as TokenMetadata;
};

export const transfer = async (
  identity: Identity,
  canisterId: Principal,
  to: Principal,
  amount: bigint,
) => {
  const agent = await createAgent({
    identity,
    host,
    fetchRootKey: process.env.NODE_ENV === 'development',
  });

  const icrc1 = IcrcLedgerCanister.create({
    agent,
    canisterId: canisterId,
  });

  const res = await icrc1.transfer({
    to: {
      owner: to,
      subaccount: [],
    },
    amount,
  });
  return res;
};
