import { Canvas } from '@react-three/fiber';
import { Stats, Sky, KeyboardControls } from '@react-three/drei';
import Players from '../components/Players';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Ground from '../components/Ground';
import Mines from '../components/Mines';
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
import { Button, CircularProgress, Stack, Typography } from '@mui/joy';
import GameStats from '../components/GameStats';
import PlayerStats from '../components/PlayerStats';

export default function Game() {
  const {
    world,
    isPlayerDead,
    playerEntityId,
    playerPrincipalId,
    connect,
    isConnected,
    isConnecting,
  } = useWorld();
  const { openDialog } = useDialog();

  const onReconnectClick = () => {
    connect();
  };

  useEffect(() => {
    if (isPlayerDead) {
      openDialog(<Respawn />);
    }
  }, [isPlayerDead]);

  if (isConnecting) {
    return (
      <Stack justifyContent="center" alignItems="center" height="100%" gap={2}>
        <CircularProgress />
        <Typography level="h4">Connecting...</Typography>
      </Stack>
    );
  }

  if (!playerPrincipalId) {
    return <Navigate to="/" />;
  }

  if (!isConnected) {
    return (
      <Stack justifyContent="center" alignItems="center" height="100%" gap={2}>
        <Typography level="h4">Disconnected</Typography>
        <Button variant="outlined" onClick={onReconnectClick}>
          Reconnect
        </Button>
      </Stack>
    );
  }

  const mineEntities = world.getEntitiesByArchetype([
    ResourceComponent,
    TransformComponent,
  ]);
  const playerEntities = world.getEntitiesByArchetype([
    PrincipalComponent,
    TransformComponent,
  ]);

  if (!playerEntityId) {
    return null;
  }

  // Player entity
  const playerEntity = world.getEntity(playerEntityId);
  const playerTransform = playerEntity.getComponent(TransformComponent);

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
        <Canvas
          shadows
          gl={{ alpha: false }}
          camera={{
            position: [
              playerTransform.position.x - 5,
              5,
              playerTransform.position.y - 5,
            ],
          }}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={1} />
          <pointLight
            castShadow
            intensity={100000}
            position={[100, 100, 100]}
          />
          <color attach="background" args={['#f0f0f0']} />
          <fog attach="fog" args={['#f0f0f0', 0, 75]} />
          <Ground />
          <Players entityIds={playerEntities} />
          <Mines entityIds={mineEntities} />
        </Canvas>
      </KeyboardControls>
      <PlayerStats />
      <PlayerCard />
      <TargetCard />
      <GameStats />
    </>
  );
}
