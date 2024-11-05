import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { MiningComponent, PlaceBlockComponent } from '../ecs/components';
import { CHUNK_SIZE } from '../const/blocks';

export interface VoxelUpdate {
  index: number;
  chunkKey: string;
  position: THREE.Vector3;
}

function useVoxelUpdates(
  mining: MiningComponent,
  placing: PlaceBlockComponent,
) {
  const [minedVoxels, setMinedVoxels] = useState<VoxelUpdate[]>([]);
  const [placingVoxels, setPlacingVoxels] = useState<VoxelUpdate[]>([]);

  const mapPositionsToVoxels = (positions: THREE.Vector3[]) => {
    return positions.map((position) => {
      const chunkKey = `chunk-${Math.floor(
        position.x / CHUNK_SIZE,
      )}-${Math.floor(position.z / CHUNK_SIZE)}`;
      const localPosition = new THREE.Vector3(
        ((position.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
        position.y,
        ((position.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
      );
      const index =
        localPosition.x +
        localPosition.z * CHUNK_SIZE +
        localPosition.y * CHUNK_SIZE * CHUNK_SIZE;
      return { index, chunkKey, position };
    });
  };

  useEffect(() => {
    if (mining) {
      setMinedVoxels(mapPositionsToVoxels(mining.positions));
    } else {
      setMinedVoxels([]);
    }
  }, [mining]);

  useEffect(() => {
    if (placing) {
      setPlacingVoxels(mapPositionsToVoxels(placing.positions));
    } else {
      setPlacingVoxels([]);
    }
  }, [placing]);

  return { minedVoxels, placingVoxels };
}

export default useVoxelUpdates;
