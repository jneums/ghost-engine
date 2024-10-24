import * as THREE from 'three';
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface LightningBeamProps {
  start: THREE.Vector3;
  getEndPosition: () => THREE.Vector3 | null;
}

const LightningBeam: React.FC<LightningBeamProps> = ({
  start,
  getEndPosition,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const end = getEndPosition();
    if (end && meshRef.current) {
      const points = generateLightningPath(start, end);
      const path = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(path, 20, 0.02, 8);
      meshRef.current.geometry = geometry;
    }
  });

  return (
    <mesh ref={meshRef}>
      <meshBasicMaterial color="red" />
    </mesh>
  );
};

function generateLightningPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
): THREE.Vector3[] {
  const points = [];
  const segments = 2; // Just start and end for a straight line

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pos = new THREE.Vector3().lerpVectors(start, end, t);
    pos.x += 0.5;
    pos.y += 0.5;
    pos.z += 0.5;
    points.push(pos);
  }

  return points;
}

export default LightningBeam;
