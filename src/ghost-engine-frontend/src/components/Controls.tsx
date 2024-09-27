import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CameraControls as CameraControlsDrei } from '@react-three/drei';
import CameraControls from 'camera-controls';

const SPEED = 25; // Adjusted speed to make it slower
const keys = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
  Space: 'jump',
};
const moveFieldByKey = (key: string) => keys[key as keyof typeof keys];

const usePlayerControls = () => {
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) =>
      setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: true }));
    const handleKeyUp = (e: KeyboardEvent) =>
      setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: false }));
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  return movement;
};

export default function Controls() {
  const { forward, backward, left, right } = usePlayerControls();
  const cameraControlsRef = useRef<CameraControls>(null);

  useFrame((_, deltaTime) => {
    if (!cameraControlsRef.current) return;

    if (forward) {
      cameraControlsRef.current.forward(SPEED * deltaTime);
    }
    if (backward) {
      cameraControlsRef.current.forward(-SPEED * deltaTime);
    }
    if (left) {
      cameraControlsRef.current.truck(-SPEED * deltaTime, 0);
    }
    if (right) {
      cameraControlsRef.current.truck(SPEED * deltaTime, 0);
    }
  });

  return (
    <CameraControlsDrei
      ref={cameraControlsRef}
      mouseButtons={{
        left: CameraControls.ACTION.NONE,
        right: CameraControls.ACTION.ROTATE,
        middle: CameraControls.ACTION.NONE,
        wheel: CameraControls.ACTION.ZOOM,
      }}
    />
  );
}
