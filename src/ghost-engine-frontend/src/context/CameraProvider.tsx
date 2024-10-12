import React, { createContext, useContext, useState } from 'react';

type Props = {
  children: React.ReactNode;
};

type CameraContext = {
  cameraAngle: number;
  setCameraAngle: (angle: number) => void;
};

const initialContext: CameraContext = {
  cameraAngle: 0,
  setCameraAngle: () => {},
};

export const CameraContext = createContext<CameraContext>(initialContext);

export function CameraProvider({ children }: Props) {
  const [cameraAngle, setCameraAngle] = useState(45); // Initial camera angle

  return (
    <CameraContext.Provider
      value={{
        cameraAngle,
        setCameraAngle,
      }}>
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  const context = useContext(CameraContext);

  if (!context) {
    throw new Error(
      'You must be within a CameraProvider to use useCamera hook.',
    );
  }

  return context;
}
