import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import Players from '../components/Players';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Ground from '../components/Ground';
import Mines from '../components/Mines';
import PlayerCard from '../components/PlayerCard';
import TargetCard from '../components/TargetCard';
import { useWorld } from '../context/WorldProvider';
import { useDialog } from '../context/DialogProvider';
import Respawn from '../components/Respawn';
import { Button, CircularProgress, Stack, Typography } from '@mui/joy';
import GameStats from '../components/GameStats';
import PlayerStats from '../components/PlayerStats';
import LogoutButton from '../components/LogoutButton';
import { useInternetIdentity } from 'ic-use-internet-identity';

export default function Game() {
  const { isPlayerDead, playerEntityId, connect, isConnected, isConnecting } =
    useWorld();
  const { openDialog } = useDialog();
  const { identity } = useInternetIdentity();

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

  if (!identity) {
    return <Navigate to="/" />;
  }

  if (!playerEntityId) {
    return (
      <Stack justifyContent="center" alignItems="center" height="100%" gap={2}>
        <CircularProgress />
        <Typography level="h4">Creating account...</Typography>
      </Stack>
    );
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

  return (
    <>
      <Canvas shadows gl={{ alpha: false }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={1} />
        <pointLight castShadow intensity={100000} position={[100, 100, 100]} />
        <color attach="background" args={['#f0f0f0']} />
        <fog attach="fog" args={['#f0f0f0', 0, 75]} />
        <Ground />
        <Players />
        <Mines />
      </Canvas>
      <PlayerStats />
      <PlayerCard />
      <TargetCard />
      <GameStats />
      <LogoutButton />
    </>
  );
}
