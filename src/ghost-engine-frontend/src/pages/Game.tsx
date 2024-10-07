import { Canvas } from '@react-three/fiber';
import { Sky, Stats } from '@react-three/drei';
import Players from '../components/Players';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
import { getIsPlayerDead, getPlayerEntityId } from '../utils';
import { SessionComponent, TransformComponent } from '../components';
import Chunks from '../components/Chunks';

export default function Game() {
  const { world, connect, isConnected, isConnecting } = useWorld();
  const { openDialog } = useDialog();
  const { identity } = useInternetIdentity();

  const onReconnectClick = () => {
    connect();
  };

  const playerEntityId =
    identity && getPlayerEntityId(world, identity.getPrincipal());
  const isPlayerDead = playerEntityId && getIsPlayerDead(world, playerEntityId);

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

  const session = world
    .getEntity(playerEntityId)
    ?.getComponent(SessionComponent);

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

  const transform = world
    .getEntity(playerEntityId)
    ?.getComponent(TransformComponent);

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
        <Mines />
      </Canvas>
      <PlayerStats />
      <PlayerCard />
      <TargetCard />
      <GameStats />
      <LogoutButton />
      <Stats />
    </>
  );
}
