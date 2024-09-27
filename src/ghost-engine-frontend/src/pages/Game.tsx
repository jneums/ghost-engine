import { Canvas } from '@react-three/fiber';
import { Stats, Sky, KeyboardControls } from '@react-three/drei';
import Players from '../components/Players';
import Controls from '../components/Controls';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Ground from '../components/Ground';
import { useWorldState } from '../hooks/useWorldState';
import { useConnectionState } from '../hooks/useConnectionState';
import Mines from '../components/Mines';
import Cargo from '../components/Cargo';
import { findPlayersEntityId } from '../utils';
import PlayerCard from '../components/PlayerCard';
import TargetCard from '../components/TargetCard';

export default function Game() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const world = useWorldState();
  const connection = useConnectionState(world);

  useEffect(() => {
    if (!identity) {
      navigate('/');
    }
  }, [identity]);

  if (!identity || !connection) {
    return null;
  }

  // Get player entity
  const playerEntityId = findPlayersEntityId(
    Array.from(world.state.entities.values()),
    identity.getPrincipal(),
  );

  if (!playerEntityId) {
    return null;
  }

  // Get player trasnform component
  const playerEntity = world.getEntity(playerEntityId);
  if (!playerEntity) {
    return null;
  }

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
          <Players world={world} />
          <Mines world={world} connection={connection} />
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={1} />
          <pointLight
            castShadow
            intensity={100000}
            position={[100, 100, 100]}
          />
          <Ground connection={connection} world={world} identity={identity} />
          <fog attach="fog" args={['#f0f0f0', 0, 75]} />
          <Stats />
          <Controls />
        </Canvas>
      </KeyboardControls>
      <Cargo world={world} connection={connection} />
      <PlayerCard world={world} playerEntityId={playerEntityId} />
      <TargetCard world={world} playerEntityId={playerEntityId} />
    </>
  );
}
