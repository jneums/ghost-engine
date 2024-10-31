import { FungibleComponent } from '../ecs/components';

/**
 * Convert a value to the base unit used for processing, given the number of decimals.
 * @param value number
 * @param decimals number of decimal places
 * @returns value in the smallest unit as a bigint
 */
export const toBaseUnit = (value: number, decimals: number): bigint => {
  const factor = 10 ** decimals;
  return BigInt(Math.round(value * factor));
};

/**
 * Convert a value from the base unit back to the original unit, given the number of decimals.
 * @param value bigint
 * @param decimals number of decimal places
 * @returns value as a number
 */
export const fromBaseUnit = (value: bigint, decimals: number): number => {
  const factor = 10 ** decimals;
  return Number(value) / factor;
};

export const getByCanisterId = (
  tokens: FungibleComponent,
  canisterId: string,
) => {
  return tokens.tokens.find((token) => token.cid.toText() === canisterId);
};
