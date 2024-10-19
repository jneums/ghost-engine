import * as THREE from 'three';
import React, { useRef, useEffect } from 'react';
import { useFrame, extend, ReactThreeFiber } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import glsl from 'babel-plugin-glsl/macro';

// Create a custom shader material
const LightningMaterial = shaderMaterial(
  { time: 0 },
  glsl`
    varying vec3 vPosition;

    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  glsl`
    uniform float time;
    varying vec3 vPosition;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      float noise = random(vPosition.xy + time);
      float intensity = smoothstep(0.4, 0.5, noise);
      vec3 color = mix(vec3(0.5, 0.0, 0.5), vec3(0.0, 0.0, 0.5), intensity); // Purple to Blue
      gl_FragColor = vec4(color, 1.0);
    }
  `,
);

extend({ LightningMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      lightningMaterial: ReactThreeFiber.Object3DNode<
        typeof LightningMaterial,
        typeof LightningMaterial
      >;
    }
  }
}

interface LightningBeamProps {
  start: THREE.Vector3;
  getEndPosition: () => THREE.Vector3 | null;
}

const LightningBeam: React.FC<LightningBeamProps> = ({
  start,
  getEndPosition,
}) => {
  const linesRef = useRef<THREE.Line[]>([]);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
    }

    const end = getEndPosition();
    if (end) {
      linesRef.current.forEach((line) => {
        const points = generateLightningPath(
          start,
          end,
          state.clock.getElapsedTime(),
        );
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        line.geometry = geometry;
      });
    }
  });

  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <line key={index} ref={(el) => (linesRef.current[index] = el as any)}>
          <bufferGeometry />
          <lightningMaterial ref={materialRef} attach="material" />
        </line>
      ))}
    </>
  );
};

function generateLightningPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
  time: number = 0,
): THREE.Vector3[] {
  const points = [];
  const segments = 20;
  const displacement = 0.3;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pos = new THREE.Vector3().lerpVectors(start, end, t);
    pos.x += (Math.random() - 0.5) * displacement * Math.sin(time * 5 + i);
    pos.y += (Math.random() - 0.5) * displacement * Math.sin(time * 5 + i);
    pos.z += (Math.random() - 0.5) * displacement * Math.sin(time * 5 + i);
    points.push(pos);
  }

  return points;
}

export default LightningBeam;
