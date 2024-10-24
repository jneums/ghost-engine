import * as THREE from 'three';
import React from 'react';
import { useMemo } from 'react';
import Chunk from './Chunk';
import useChunks from '../hooks/useChunks';
import useMovementGrid from '../hooks/useMovementGrid';
import { useLoader } from '@react-three/fiber';

const MemoizedChunk = React.memo(Chunk);

export default function Chunks() {
  const { fetchedChunks } = useChunks();
  const createGrid = useMovementGrid(fetchedChunks);

  // Load the textureAtlas using useLoader
  const textureAtlas = useLoader(THREE.TextureLoader, '/texture-atlas.png');
  textureAtlas.magFilter = THREE.NearestFilter;
  textureAtlas.minFilter = THREE.NearestFilter;
  textureAtlas.colorSpace = THREE.SRGBColorSpace;

  const chunks = useMemo(
    () =>
      fetchedChunks?.map(({ key, x, z, data }) => (
        <MemoizedChunk
          key={key}
          x={x}
          z={z}
          data={data}
          createGrid={createGrid}
          textureAtlas={textureAtlas}
        />
      )),
    [fetchedChunks, createGrid],
  );
  return chunks;
}
