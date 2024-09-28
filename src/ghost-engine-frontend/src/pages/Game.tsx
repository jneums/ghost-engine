import { Canvas } from '@react-three/fiber';
import { Stats, Sky, KeyboardControls } from '@react-three/drei';
import Players from '../components/Players';
import Controls from '../components/Controls';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Ground from '../components/Ground';
import Mines from '../components/Mines';
import Cargo from '../components/Cargo';
import PlayerCard from '../components/PlayerCard';
import TargetCard from '../components/TargetCard';
import { useWorld } from '../context/WorldProvider';
import {
  PrincipalComponent,
  ResourceComponent,
  TransformComponent,
} from '../components';
import { useDialog } from '../context/DialogProvider';
import Respawn from '../components/Respawn';

export default function Game() {
  const { world, isPlayerDead } = useWorld();
  const { openDialog } = useDialog();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity) {
      navigate('/');
    }
  }, [identity]);

  if (!identity) {
    return null;
  }

  useEffect(() => {
    if (isPlayerDead) {
      openDialog(<Respawn />);
    }
  }, [isPlayerDead]);

  const mineEntities = world.getEntitiesByArchetype([
    ResourceComponent,
    TransformComponent,
  ]);
  const playerEntities = world.getEntitiesByArchetype([
    PrincipalComponent,
    TransformComponent,
  ]);

  return (
    <>
      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
          { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
          { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
          { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
          { name: 'jump', keys: ['Space'] },
        ]}>
        <Canvas shadows gl={{ alpha: false }} camera={{ position: [5, 5, 5] }}>
          <color attach="background" args={['#f0f0f0']} />
          <Players entityIds={playerEntities} />
          <Mines entityIds={mineEntities} />
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={1} />
          <pointLight
            castShadow
            intensity={100000}
            position={[100, 100, 100]}
          />
          <Ground />
          <fog attach="fog" args={['#f0f0f0', 0, 75]} />
          <Stats />
          <Controls />
        </Canvas>
      </KeyboardControls>
      <Cargo />
      <PlayerCard />
      <TargetCard />
    </>
  );
}
