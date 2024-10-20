import { ReactNode } from 'react';

export default function NoTextSelect({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        userSelect: 'none',
      }}>
      {children}
    </div>
  );
}
