import * as THREE from 'three';
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { ThreeEvent, useFrame, useLoader, useThree } from '@react-three/fiber';
import Chunk from './Chunk';
import useChunks from '../hooks/useChunks';
import useMovementGrid from '../hooks/useMovementGrid';
import { useWorld } from '../context/WorldProvider';
import { useErrorMessage } from '../context/ErrorProvider';
import { DRAG_THRESHOLD } from '../const/controls';
import { BlockType, CHUNK_SIZE, MINING_RADIUS } from '../const/blocks';
import { toBaseUnit } from '../utils/tokens';
import useAction from '../hooks/useAction';
import {
  ClientTransformComponent,
  FungibleComponent,
  HealthComponent,
  MiningComponent,
  MoveTargetComponent,
  PlaceBlockComponent,
} from '../ecs/components';
import { findNodeByPosition, findPath } from '../pathfinding';

const MemoizedChunk = React.memo(Chunk);

export default function Chunks() {
  const { fetchedChunks } = useChunks();
  const createGrid = useMovementGrid(fetchedChunks);
  const { activeBlock, unitEntityId, getEntity } = useWorld();
  const { setErrorMessage } = useErrorMessage();
  const { mine, move, placeBlock } = useAction();

  // Load the textureAtlas using useLoader
  const textureAtlas = useLoader(THREE.TextureLoader, '/texture-atlas.png');
  textureAtlas.magFilter = THREE.NearestFilter;
  textureAtlas.minFilter = THREE.NearestFilter;
  textureAtlas.colorSpace = THREE.SRGBColorSpace;

  const { scene } = useThree();
  const raycaster = new THREE.Raycaster();
  const highlightPositionRef = useRef<THREE.Vector3 | null>(null);
  const [highlightPosition, setHighlightPosition] =
    useState<THREE.Vector3 | null>(null);
  const [minedVoxel, setMinedVoxel] = useState<{
    index: number;
    chunkKey: string;
  } | null>(null);
  const [placingVoxel, setPlacingVoxel] = useState<{
    index: number;
    chunkKey: string;
  } | null>(null);

  useFrame(({ camera, pointer }) => {
    if (!unitEntityId) {
      return;
    }

    // Clear mined voxel index or placing voxel index if the player is not mining or placing
    const mining = getEntity(unitEntityId)?.getComponent(MiningComponent);
    if (!mining && minedVoxel !== null) {
      setMinedVoxel(null);
    }

    const placing = getEntity(unitEntityId)?.getComponent(PlaceBlockComponent);
    if (!placing && placingVoxel !== null) {
      setPlacingVoxel(null);
    }

    raycaster.setFromCamera(pointer, camera);

    const closestIntersection = scene.children
      .filter((child) => child.name.startsWith('chunk'))
      .flatMap((child) => raycaster.intersectObject(child, true))
      .reduce<THREE.Intersection | null>((closest, intersect) => {
        if (!closest || intersect.distance < closest.distance) {
          return intersect;
        }
        return closest;
      }, null);

    if (closestIntersection) {
      const point = closestIntersection.point;
      const faceNormal = closestIntersection.face?.normal;

      if (faceNormal) {
        let targetPosition: THREE.Vector3;
        if (activeBlock) {
          targetPosition = new THREE.Vector3(
            Math.floor(point.x + faceNormal.x * 0.5),
            Math.floor(point.y + faceNormal.y * 0.5),
            Math.floor(point.z + faceNormal.z * 0.5),
          );
        } else {
          targetPosition = new THREE.Vector3(
            Math.floor(point.x - faceNormal.x * 0.5),
            Math.floor(point.y - faceNormal.y * 0.5),
            Math.floor(point.z - faceNormal.z * 0.5),
          );
        }

        if (
          !highlightPositionRef.current ||
          !highlightPositionRef.current.equals(targetPosition)
        ) {
          highlightPositionRef.current = targetPosition;
          setHighlightPosition(targetPosition);
        }
      }
    } else if (highlightPositionRef.current !== null) {
      highlightPositionRef.current = null;
      setHighlightPosition(null);
    }
  });

  const handleBlockAction = useCallback(
    (e: ThreeEvent<MouseEvent>, chunkData: Uint16Array | number[]) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;

      if (!unitEntityId) {
        console.error('Unit entity not found');
        return;
      }

      const unitEntity = getEntity(unitEntityId);

      const faceNormal = e.face?.normal;
      if (!faceNormal) {
        console.error('Face normal not found');
        return;
      }

      const voxelId = activeBlock;

      const targetPosition = new THREE.Vector3(
        Math.floor(e.point.x + faceNormal.x * (voxelId ? 0.5 : -0.5)),
        Math.floor(e.point.y + faceNormal.y * (voxelId ? 0.5 : -0.5)),
        Math.floor(e.point.z + faceNormal.z * (voxelId ? 0.5 : -0.5)),
      );

      const localPosition = new THREE.Vector3(
        ((targetPosition.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
        targetPosition.y,
        ((targetPosition.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
      );

      const index =
        localPosition.x +
        localPosition.z * CHUNK_SIZE +
        localPosition.y * CHUNK_SIZE * CHUNK_SIZE;

      if (index < 0 || index >= chunkData.length) {
        console.error('Index out of bounds:', index);
        return;
      }

      const transform = unitEntity.getComponent(ClientTransformComponent);
      if (!transform) {
        console.error('Transform component not found');
        return;
      }

      const startPosition = transform.position;
      const distance = targetPosition.distanceTo(startPosition);
      const inRange = distance < Math.sqrt(3 * MINING_RADIUS);

      if (!inRange) {
        setErrorMessage('You are too far away!');
        return;
      }

      if (!voxelId) {
        if (
          chunkData[index] === BlockType.Air ||
          chunkData[index] === BlockType.Water
        ) {
          setErrorMessage("I can't mine that!");
          return;
        }
        setMinedVoxel({ index, chunkKey: e.object.name });
        mine(unitEntityId, targetPosition);
      } else {
        const fungible = unitEntity.getComponent(FungibleComponent);
        const token = fungible?.tokens.find(
          (t) => t.cid.toText() === voxelId.toText(),
        );
        if (!token || token.amount < toBaseUnit(1, token.decimals)) {
          setErrorMessage('You do not have enough blocks to place!');
          return;
        }
        if (chunkData[index] !== BlockType.Air) {
          setErrorMessage('Block already exists here!');
          return;
        }
        setPlacingVoxel({ index, chunkKey: e.object.name });
        placeBlock(unitEntityId, targetPosition, voxelId);
      }
    },
    [unitEntityId, getEntity, mine, placeBlock, setErrorMessage, activeBlock],
  );

  const handleMove = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;

      if (!unitEntityId) {
        console.error('Unit entity not found');
        return;
      }

      const unitEntity = getEntity(unitEntityId);

      const health = unitEntity.getComponent(HealthComponent);
      if (!health) {
        console.error('Health component not found');
        return;
      }
      if (health && health.amount <= 0) {
        setErrorMessage('You are dead!');
        return;
      }

      const transform = unitEntity.getComponent(ClientTransformComponent);
      if (!transform) {
        console.error('Transform component not found');
        return;
      }

      let startPosition = new THREE.Vector3(
        Math.round(transform.position.x),
        Math.round(transform.position.y),
        Math.round(transform.position.z),
      );

      const moveTarget = unitEntity.getComponent(MoveTargetComponent);
      if (moveTarget && moveTarget.waypoints.length > 1) {
        startPosition = moveTarget.waypoints[1];
      }

      const targetPosition = new THREE.Vector3(
        Math.floor(e.point.x),
        Math.floor(e.point.y),
        Math.floor(e.point.z),
      );

      const grid = createGrid(startPosition, targetPosition);

      if (!grid) {
        setErrorMessage('Cannot find path');
        return;
      }

      const startNode = findNodeByPosition(grid, startPosition);
      const endNode = findNodeByPosition(grid, targetPosition);

      if (!startNode || !endNode) {
        setErrorMessage('Start or end node not found');
        return;
      }

      const path = findPath(startNode, endNode);

      if (!path || path.length === 0) {
        setErrorMessage('No valid path found');
        return;
      }

      const waypoints = path.map(([x, y, z]) => new THREE.Vector3(x, y, z));
      move(unitEntityId, waypoints);
    },
    [move, unitEntityId, getEntity, setErrorMessage, createGrid],
  );

  const chunks = useMemo(
    () =>
      fetchedChunks?.map(({ key, x, z, data }) => (
        <MemoizedChunk
          key={key}
          x={x}
          z={z}
          data={data}
          textureAtlas={textureAtlas}
          highlightPosition={highlightPosition}
          minedVoxel={minedVoxel?.chunkKey === key ? minedVoxel.index : null}
          placingVoxel={
            placingVoxel?.chunkKey === key ? placingVoxel.index : null
          }
          onBlockAction={handleBlockAction}
          onMove={handleMove}
        />
      )),
    [
      fetchedChunks,
      createGrid,
      textureAtlas,
      highlightPosition,
      minedVoxel,
      placingVoxel,
      handleBlockAction,
      handleMove,
    ],
  );

  return <>{chunks}</>;
}