import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Cloud, Sky, Stats } from '@react-three/drei';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import TargetCard from '../ui/TargetCard';
import { useWorld } from '../context/WorldProvider';
import { useDialog } from '../context/DialogProvider';
import Respawn from '../ui/Respawn';
import { CircularProgress, Stack, Typography } from '@mui/joy';
import LogoutButton from '../ui/LogoutButton';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useConnection } from '../context/ConnectionProvider';
import { HealthComponent, TransformComponent } from '../ecs/components';
import Units from '../units/Units';
import UnitCard from '../ui/UnitCard';
import UnitStats from '../ui/UnitInventory';
import Unit from '../units/Unit';
import Chunks from '../chunks';
import CastBar from '../ui/CastBar';

export default function Game() {
  const { connect, disconnect, isConnecting } = useConnection();
  const { unitEntityId, getEntity } = useWorld();
  const { openDialog } = useDialog();
  const { identity } = useInternetIdentity();

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

  const isUnitDead = unitEntityId
    ? getEntity(unitEntityId).getComponent(HealthComponent)?.amount <= 0
    : false;

  useEffect(() => {
    if (isUnitDead) {
      openDialog(<Respawn />);
    }
  }, [isUnitDead]);

  if (!identity) {
    return <Navigate to="/" />;
  }

  if (isConnecting) {
    return (
      <Stack justifyContent="center" alignItems="center" height="100%" gap={2}>
        <CircularProgress />
        <Typography level="h4">Connecting...</Typography>
      </Stack>
    );
  }

  if (!unitEntityId) {
    return (
      <Stack justifyContent="center" alignItems="center" height="100%" gap={2}>
        <CircularProgress />
        <Typography level="h4">Creating account...</Typography>
      </Stack>
    );
  }

  const transform = getEntity(unitEntityId).getComponent(TransformComponent);
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
        gl={{ powerPreference: 'low-power' }}
        shadows
        camera={{
          position: [
            transform.position.x + 5,
            transform.position.y + 3,
            transform.position.z + 5,
          ],
          fov: 60,
        }}>
        <Chunks />
        <Units />
        <hemisphereLight
          args={[
            new THREE.Color(0xffffff).setHSL(0.6, 1, 0.6),
            new THREE.Color(0xffffff).setHSL(0.095, 1, 0.75),
            1,
          ]}
          position={[0, 50, 0]}
        />
        <directionalLight
          color={new THREE.Color(0xffffff).setHSL(0.1, 1, 0.95)}
          intensity={3}
          position={[-30, 52.5, 30]}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-camera-far={3500}
          shadow-bias={-0.0001}
        />
        <fog attach="fog" args={['#f0f0f0', 0, 90]} />
      </Canvas>
      <UnitCard />
      <UnitStats />
      <TargetCard />
      <CastBar />
      <LogoutButton />
      {/* <Stats /> */}
    </>
  );
}
