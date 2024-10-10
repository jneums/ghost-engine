import { Canvas } from '@react-three/fiber';
import { Sky, Stats } from '@react-three/drei';
import Players from '../components/Players';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
import { TransformComponent } from '../components';
import Chunks from '../components/Chunks';
import { useConnection } from '../context/ConnectionProvider';

export default function Game() {
  const { connect, isConnecting, isConnected } = useConnection();
  const { playerEntityId, isPlayerDead, getEntity, session } = useWorld();
  const { openDialog } = useDialog();
  const { identity } = useInternetIdentity();

  const onReconnectClick = () => {
    if (!identity) {
      throw new Error('Identity not found');
    }

    connect();
  };

  if (!identity) {
    return <Navigate to="/" />;
  }

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

  if (!playerEntityId) {
    return (
      <Stack justifyContent="center" alignItems="center" height="100%" gap={2}>
        <CircularProgress />
        <Typography level="h4">Creating account...</Typography>
      </Stack>
    );
  }

  if (!isConnected || !session) {
    return (
      <Stack justifyContent="center" alignItems="center" height="100%" gap={2}>
        <Typography level="h4">Disconnected</Typography>
        <Button variant="outlined" onClick={onReconnectClick}>
          Reconnect
        </Button>
      </Stack>
    );
  }

  const transform = getEntity(playerEntityId).getComponent(TransformComponent);

  if (!transform) {
    return null;
  }

  return (
    <>
      <Canvas
        onPointerMissed={(e) => console.log('missed: ', e)}
        shadows
        gl={{ alpha: false }}
        camera={{
          position: [
            transform.position.x,
            transform.position.y,
            transform.position.x,
          ],
        }}>
        <Sky sunPosition={[10, 200, 10]} />
        <ambientLight intensity={0.1} />
        <pointLight castShadow intensity={100000} position={[100, 500, 100]} />
        <color attach="background" args={['#f0f0f0']} />
        <fog attach="fog" args={['#f0f0f0', 0, 75]} />
        <Chunks />
        <Players />
      </Canvas>
      <PlayerStats />
      <PlayerCard />
      <TargetCard />
      <GameStats />
      <LogoutButton />
      {/* <Stats /> */}
    </>
  );
}
