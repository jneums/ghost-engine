import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import Players from '../components/Players';
import { useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';
import TargetCard from '../components/TargetCard';
import { useWorld } from '../context/WorldProvider';
import { useDialog } from '../context/DialogProvider';
import Respawn from '../components/Respawn';
import { Button, CircularProgress, Stack, Typography } from '@mui/joy';
import LogoutButton from '../components/LogoutButton';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useConnection } from '../context/ConnectionProvider';
import { HealthComponent, TransformComponent } from '../components';
import useChunks from '../hooks/useChunks';
import Chunk from '../components/Chunk';
import React from 'react';
import MovementGrid from '../components/MovementGrid';

const MemoizedChunk = React.memo(Chunk);

export default function Game() {
  const { connect, disconnect, isConnecting, isConnected } = useConnection();
  const { playerEntityId, getEntity } = useWorld();
  const { openDialog } = useDialog();
  const { identity } = useInternetIdentity();
  const { fetchedChunks } = useChunks();

  if (!identity) {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    if (identity) {
      connect(identity);
    }

    return () => {
      if (identity) {
        disconnect(identity);
      }
    };
  }, [identity, connect, disconnect]);

  const isPlayerDead = playerEntityId
    ? getEntity(playerEntityId).getComponent(HealthComponent).amount <= 0
    : false;

  useEffect(() => {
    if (isPlayerDead) {
      openDialog(<Respawn />);
    }
  }, [isPlayerDead]);

  const chunks = useMemo(
    () =>
      fetchedChunks?.map(({ key, x, z, data }) => (
        <MemoizedChunk key={key} x={x} z={z} data={data} />
      )),
    [fetchedChunks],
  );

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

  const transform = getEntity(playerEntityId).getComponent(TransformComponent);
  if (!transform) {
    return (
      <Stack justifyContent="center" alignItems="center" height="100%" gap={2}>
        <CircularProgress />
        <Typography level="h4">Loading...</Typography>
      </Stack>
    );
  }

  return (
    <>
      <Canvas
        onPointerMissed={(e) => console.log('missed: ', e)}
        onContextMenu={(e) => e.preventDefault()}
        camera={{
          position: [
            transform.position.x + 5,
            transform.position.y + 3,
            transform.position.z + 5,
          ],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}>
        <ambientLight intensity={0.1} />
        <pointLight intensity={50000} position={[100, 500, 100]} />
        <fog attach="fog" args={['#f0f0f0', 0, 75]} />
        {chunks}
        <MovementGrid fetchedChunks={fetchedChunks} />
        <Players />
      </Canvas>
      <PlayerCard />
      <TargetCard />
      <LogoutButton />
      <Stats />
    </>
  );
}
