import { Button, Card, Input, Stack, Typography } from '@mui/joy';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useWorld } from '../../context/WorldProvider';
import useAction from '../../hooks/useAction';
import React, { useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { ImportFungibleComponent } from '../../ecs/components';

export default function ImportToken() {
  const { unitEntityId, getEntity } = useWorld();
  const { importFungible } = useAction();
  const { identity } = useInternetIdentity();
  const [tokenCid, setTokenCid] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  if (!identity || !unitEntityId) {
    return null;
  }

  const importFun = getEntity(unitEntityId).getComponent(
    ImportFungibleComponent,
  );

  useEffect(() => {
    if (!importFun) {
      setLoading(false);
      setTokenCid('');
    }
  }, [importFun]);

  const handleImport = () => {
    setLoading(true);
    importFungible(
      unitEntityId,
      Principal.fromText(tokenCid),
      identity.getPrincipal(),
    );
  };

  return (
    <Input
      placeholder="yjprz-siaaa-aaaai-qpkaq-cai"
      value={tokenCid}
      onChange={(e) => setTokenCid(e.target.value)}
      startDecorator={
        <Typography level="body-sm" textTransform="uppercase" fontWeight="lg">
          Canister ID
        </Typography>
      }
      endDecorator={
        <Stack direction="row" gap={2} alignItems="center">
          <Button
            loading={loading}
            onClick={handleImport}
            color="success"
            variant="soft">
            Import
          </Button>
        </Stack>
      }
      fullWidth
    />
  );
}
