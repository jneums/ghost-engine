export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 384;

// Define an enum for block types
export enum BlockType {
  Air = 0,
  Stone = 1,
  Water = 2,
}

export const BLOCK_TYPES: Record<number, BlockType> = {
  0: BlockType.Air,
  1: BlockType.Stone,
  2: BlockType.Water,
};

// Define a mapping from block type names to their color values and opacity
export const VERTEX_COLORS: Record<BlockType, [number, number, number]> = {
  [BlockType.Air]: [0, 0, 0],
  [BlockType.Stone]: [0.5, 0.5, 0.5],
  [BlockType.Water]: [0.46, 0.71, 0.77],
};

export const HEX_COLORS: Record<BlockType, number> = {
  [BlockType.Air]: 0x000000,
  [BlockType.Stone]: 0xaaaaaa,
  [BlockType.Water]: 0x76b6c4,
};

export const MINING_RADIUS = 5;
