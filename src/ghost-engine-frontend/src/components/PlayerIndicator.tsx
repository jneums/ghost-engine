import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { ClientTransformComponent } from '.';
import { useWorld } from '../context/WorldProvider';
import { useFrame } from '@react-three/fiber';
import { CHUNK_HEIGHT } from '../utils/terrain';

export default function PlayerIndicator() {
  const { playerEntityId, getEntity } = useWorld();
  const indicatorRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!indicatorRef.current) return;

    // Create segments once
    for (let i = 0; i < CHUNK_HEIGHT; i++) {
      const segment = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1, 32),
        new THREE.MeshBasicMaterial({
          color: 'red',
          transparent: true,
          opacity: 0.5,
        }),
      );
      segment.position.set(0, -i - 0, 0);
      indicatorRef.current.add(segment);
    }
  }, []);

  useFrame(() => {
    if (!playerEntityId || !indicatorRef.current) return;

    const transform = getEntity(playerEntityId).getComponent(
      ClientTransformComponent,
    );
    if (transform) {
      const playerHeight = Math.floor(transform.position.y);

      // Update segment visibility based on player height
      indicatorRef.current.children.forEach((segment, index) => {
        segment.visible = index < playerHeight;
      });
    }
  });

  return <group ref={indicatorRef} />;
}
