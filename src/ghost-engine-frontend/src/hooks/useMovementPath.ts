import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useWorld } from '../context/WorldProvider';
import {
  ClientMoveTargetComponent,
  MoveTargetComponent,
} from '../ecs/components';
import { EntityId } from '../ecs/entity';

// Function to check if the new path is a suffix of the previous path
function isSuffixOfPreviousPath(
  previousPath: THREE.Vector3[],
  newPath: THREE.Vector3[],
): boolean {
  const newPathLength = newPath.length;
  const previousPathSuffix = previousPath.slice(-newPathLength);

  if (previousPathSuffix.length !== newPathLength) {
    return false;
  }

  return previousPathSuffix.every((waypoint, index) =>
    waypoint.equals(newPath[index]),
  );
}

function useMovementPath(entityId: EntityId) {
  const { getEntity } = useWorld();
  const entity = getEntity(entityId);
  const moveTarget = entity.getComponent(MoveTargetComponent);
  const clientMoveTarget = entity.getComponent(ClientMoveTargetComponent);

  // Ref to store the previous movement path
  const previousPathRef = useRef<THREE.Vector3[]>([]);

  useEffect(() => {
    if (
      moveTarget?.waypoints.length &&
      !clientMoveTarget?.waypoints.length &&
      !isSuffixOfPreviousPath(previousPathRef.current, moveTarget?.waypoints)
    ) {
      console.log('[isSuffix!] Setting new client move target');
      entity.addComponent(new ClientMoveTargetComponent(moveTarget.waypoints));
      previousPathRef.current = [...moveTarget.waypoints];
      console.log('Setting previous path to', moveTarget.waypoints);
    }
  }, [moveTarget, clientMoveTarget, entity, previousPathRef]);
}

export default useMovementPath;
