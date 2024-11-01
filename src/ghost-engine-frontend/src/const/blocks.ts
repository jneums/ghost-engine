export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

export const TILE_SIZE = 16;
export const TILE_TEXTURE_WITH = 256;
export const TILE_TEXTURE_HEIGHT = 32;

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

export const HEX_COLORS: Record<BlockType, number> = {
  [BlockType.Air]: 0x000000,
  [BlockType.Stone]: 0xaaaaaa,
  [BlockType.Water]: 0x76b6c4,
};

export const MINING_RADIUS = 5;
