import { Principal } from '@dfinity/principal';

export const WORLD_PRINCIPAL = Principal.fromText(
  process.env.CANISTER_ID_GHOST_ENGINE_BACKEND!,
);
