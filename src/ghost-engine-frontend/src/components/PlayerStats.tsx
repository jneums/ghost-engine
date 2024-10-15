import * as THREE from 'three';
import { Card, IconButton, Stack, Typography } from '@mui/joy';
import { fromE8s } from '../utils';
import {
  ClientTransformComponent,
  FungibleComponent,
  MoveTargetComponent,
  RedeemTokensComponent,
  TransformComponent,
} from '.';
import {
  CameraswitchOutlined,
  DownloadOutlined,
  PublishOutlined,
  Send,
} from '@mui/icons-material';
import { useDialog } from '../context/DialogProvider';
import SendTokens from './SendTokens';
import { useEffect } from 'react';
import React from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../context/WorldProvider';
import { useCamera } from '../context/CameraProvider';
import MoveAction from '../actions/move-action';
import { useConnection } from '../context/ConnectionProvider';

export default function PlayerStats() {
  const { send } = useConnection();
  const { cameraAngle, setCameraAngle } = useCamera();
  const { playerEntityId, getEntity, addComponent } = useWorld();
  const { identity } = useInternetIdentity();
  const { openDialog } = useDialog();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!identity) {
    throw new Error('Identity not found');
  }
  if (!playerEntityId) {
    return null;
  }

  // Get any fungible token components
  const entity = getEntity(playerEntityId);
  const fungible = entity.getComponent(FungibleComponent);
  const tokens = fungible?.tokens || [];

  const redeem = entity.getComponent(RedeemTokensComponent);

  useEffect(() => {
    if (redeem) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [redeem]);

  const handleSendClick = () => {
    openDialog(<SendTokens />);
  };

  const handleRotateClick = () => {
    const cameraRotationIndex = (cameraAngle / (Math.PI / 2) + 1) % 4;
    setCameraAngle((Math.PI / 2) * cameraRotationIndex);
  };

  const handleElevationClick = (altitudeDelta: number) => {
    const transform = entity.getComponent(ClientTransformComponent);
    if (!transform) return;
    const target = entity.getComponent(MoveTargetComponent);
    const moveAction = new MoveAction(addComponent, send);
    const targetPosition =
      target?.waypoints?.length > 0 ? target.waypoints[0] : transform.position;
    const position = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y + altitudeDelta,
      targetPosition.z,
    );
    moveAction.handle({
      entityId: playerEntityId,
      waypoints: [position],
    });
  };

  return (
    <Stack position="absolute" bottom="76px" left={0} padding={2}>
      <Card size="sm" variant="soft">
        <Stack direction="row" gap={1} justifyContent="space-between">
          <IconButton onClick={handleRotateClick}>
            <CameraswitchOutlined />
          </IconButton>
          <IconButton onClick={() => handleElevationClick(1)}>
            <PublishOutlined />
          </IconButton>
          <IconButton onClick={() => handleElevationClick(-1)}>
            <DownloadOutlined />
          </IconButton>
        </Stack>
        {tokens.map((token) => (
          <Stack
            key={token.cid.toString()}
            direction="row"
            gap={1}
            justifyContent="space-between">
            <Typography level="body-xs">{token.symbol}</Typography>
            <Stack direction="row" gap={1}>
              <Typography level="body-xs">{fromE8s(token.amount)}</Typography>
              <IconButton
                disabled={isLoading}
                size="sm"
                sx={{ p: 0, m: 0, minWidth: 0, minHeight: 0 }}
                onClick={handleSendClick}>
                <Send style={{ display: 'block', fontSize: '14px' }} />
              </IconButton>
            </Stack>
          </Stack>
        ))}
      </Card>
    </Stack>
  );
}
