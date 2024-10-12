import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useErrorMessage } from '../context/ErrorProvider';
import { useCallback, useMemo } from 'react';
import MoveAction from '../actions/move-action';
import { useWorld } from '../context/WorldProvider';
import { useConnection } from '../context/ConnectionProvider';
import {
  ClientTransformComponent,
  HealthComponent,
  MoveTargetComponent,
} from '.';
const DRAG_THRESHOLD = 5;

export default function MovementGrid({
  movementGrid,
}: {
  movementGrid: { grid: number[][][]; gridOrigin: THREE.Vector3 } | null;
}) {
  const { addComponent, playerEntityId, getEntity } = useWorld();
  const { send } = useConnection();
  const { setErrorMessage } = useErrorMessage();

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_THRESHOLD) return;
      console.log('Floor RIGHT clicked!');

      if (!playerEntityId) {
        console.error('Player entity not found');
        return;
      }

      const health = getEntity(playerEntityId).getComponent(HealthComponent);
      if (!health) {
        console.error('Health component not found');
        return;
      }
      if (health && health.amount <= 0) {
        console.error('You are dead!');
        setErrorMessage('You are dead!');
        return;
      }

      const transform = getEntity(playerEntityId).getComponent(
        ClientTransformComponent,
      );
      if (!transform) {
        console.error('Transform component not found');
        return;
      }

      const target =
        getEntity(playerEntityId).getComponent(MoveTargetComponent);
      const targetPosition = target?.position || transform.position;

      const move = new MoveAction(addComponent, send);
      move.handle({
        entityId: playerEntityId,
        position: new THREE.Vector3(e.point.x, targetPosition.y, e.point.z),
      });
    },
    [setErrorMessage],
  );

  // Render the movement grid
  const gridBoxes = useMemo(() => {
    if (!movementGrid) return null;

    const { grid, gridOrigin } = movementGrid;
    if (!grid) return null;
    const gridSize = grid[0].length; // Assuming all layers have the same size

    const boxes = [];

    // Indices for the layers in the movementGrid
    const aboveLayerIndex = 0;
    const currentLayerIndex = 1;
    const belowLayerIndex = 2;

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const isWalkableAbove = grid[aboveLayerIndex]?.[x]?.[z] === 1;
        const isWalkableCurrent = grid[currentLayerIndex]?.[x]?.[z] === 1;
        const isWalkableBelow = grid[belowLayerIndex]?.[x]?.[z] === 1;

        if (isWalkableAbove) {
          // Above layer
          boxes.push(
            <mesh
              key={`grid-${x}-${z}-above`}
              onClick={handleClick}
              position={[
                gridOrigin.x + x + 0.5, // Align with grid origin
                gridOrigin.y, // One voxel above
                gridOrigin.z + z + 0.5, // Align with grid origin
              ]}>
              <boxGeometry args={[1, 0.1, 1]} />
              <meshBasicMaterial color="gold" transparent opacity={0.25} />
            </mesh>,
          );
        }

        if (isWalkableCurrent) {
          // Current layer
          boxes.push(
            <mesh
              key={`grid-${x}-${z}-current`}
              onClick={handleClick}
              position={[
                gridOrigin.x + x + 0.5, // Align with grid origin
                gridOrigin.y - 1, // Align with current layer
                gridOrigin.z + z + 0.5, // Align with grid origin
              ]}>
              <boxGeometry args={[1, 0.1, 1]} />
              <meshBasicMaterial color="gold" transparent opacity={0.15} />
            </mesh>,
          );
        }

        if (isWalkableBelow) {
          // Below layer
          boxes.push(
            <mesh
              key={`grid-${x}-${z}-below`}
              onClick={handleClick}
              position={[
                gridOrigin.x + x + 0.5, // Align with grid origin
                gridOrigin.y - 2, // One voxel below
                gridOrigin.z + z + 0.5, // Align with grid origin
              ]}>
              <boxGeometry args={[1, 0.1, 1]} />
              <meshBasicMaterial color="gold" transparent opacity={0.05} />
            </mesh>,
          );
        }
      }
    }

    return boxes;
  }, [movementGrid, handleClick]);

  return gridBoxes;
}
