import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';

function useCameraControls() {
  const { gl } = useThree();
  const [zoomLevel, setZoomLevel] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({
    azimuthal: 0,
    polar: Math.PI / 4,
  });
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [initialPinchDistance, setInitialPinchDistance] = useState<
    number | null
  >(null);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      setZoomLevel((prevZoom) =>
        Math.max(0.1, Math.min(5, prevZoom + event.deltaY * 0.001)),
      );
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        setIsDragging(true);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        setRotation((prevRotation) => ({
          azimuthal: prevRotation.azimuthal - event.movementX * 0.01,
          polar: Math.max(
            0.1,
            Math.min(
              Math.PI - 0.1,
              prevRotation.polar - event.movementY * 0.01,
            ),
          ), // Invert Y-axis
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        setIsDragging(true);
        setLastTouch({
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        });
      } else if (event.touches.length === 2) {
        event.preventDefault(); // Prevent default touch behavior
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2),
        );
        setInitialPinchDistance(distance);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isDragging && event.touches.length === 1 && lastTouch) {
        event.preventDefault(); // Prevent default touch behavior
        const touch = event.touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        setRotation((prevRotation) => ({
          azimuthal: prevRotation.azimuthal - deltaX * 0.01,
          polar: Math.max(
            0.1,
            Math.min(Math.PI - 0.1, prevRotation.polar - deltaY * 0.01),
          ), // Invert Y-axis
        }));
        setLastTouch({ x: touch.clientX, y: touch.clientY });
      } else if (event.touches.length === 2 && initialPinchDistance !== null) {
        event.preventDefault(); // Prevent default touch behavior
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2),
        );
        const zoomChange = (distance - initialPinchDistance) * 0.005;
        setZoomLevel((prevZoom) =>
          Math.max(0.5, Math.min(5, prevZoom - zoomChange)),
        );
        setInitialPinchDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setLastTouch(null);
      setInitialPinchDistance(null);
    };

    gl.domElement.addEventListener('wheel', handleWheel);
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('mouseup', handleMouseUp);
    gl.domElement.addEventListener('touchstart', handleTouchStart);
    gl.domElement.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    gl.domElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      gl.domElement.removeEventListener('wheel', handleWheel);
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('mouseup', handleMouseUp);
      gl.domElement.removeEventListener('touchstart', handleTouchStart);
      gl.domElement.removeEventListener('touchmove', handleTouchMove);
      gl.domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, lastTouch, initialPinchDistance, gl.domElement]);

  return { zoomLevel, rotation };
}

export default useCameraControls;
