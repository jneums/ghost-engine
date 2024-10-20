/**
 * Convert icp tothe  base unit used for processing ICP on the IC - e8s.
 * @param icp number
 * @returns icp in e8s
 */
export const toE8s = (value: number) => value * 100_000_000;

/**
 * Convert e8s back to icp
 * @param e8s bigint
 * @returns icp as a number
 */
export const fromE8s = (value: bigint) => Number(value) / 100_000_000;
