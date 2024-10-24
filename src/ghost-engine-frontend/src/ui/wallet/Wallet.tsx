import { Button, Card, Input, Stack, Typography } from '@mui/joy';
import { useDialog } from '../../context/DialogProvider';
import { useInternetIdentity } from 'ic-use-internet-identity';
import CopyId from '../CopyId';
import { useWorld } from '../../context/WorldProvider';
import { FungibleComponent } from '../../ecs/components';
import ImportToken from './ImportToken';
import TokenList from './TokenList';

export default function Wallet() {
  const { unitEntityId, getEntity } = useWorld();
  const { identity } = useInternetIdentity();
  const { closeDialog } = useDialog();

  if (!identity || !unitEntityId) {
    return null;
  }

  const fungible = getEntity(unitEntityId).getComponent(FungibleComponent);

  return (
    <Stack gap={4}>
      <Stack gap={3}>
        <Typography level="title-lg">Manage your tokens</Typography>

        <Stack gap={1}>
          <Typography level="title-md">Deposit</Typography>
          <Card size="sm">
            <Typography level="body-sm">Principal ID</Typography>
            <Input
              readOnly
              size="sm"
              defaultValue={identity.getPrincipal().toText()}
              sx={{ '--Input-decoratorChildHeight': '32px' }}
              endDecorator={<CopyId id={identity.getPrincipal().toText()} />}
            />
          </Card>
        </Stack>

        <Stack gap={3}>
          <Stack gap={1}>
            <Typography level="title-md">Tokens</Typography>

            <TokenList tokens={fungible?.tokens || []} />
          </Stack>

          <Stack gap={1}>
            <Typography level="title-md">Import</Typography>
            <ImportToken />
          </Stack>

          <Typography level="body-xs">
            *ICRC2 tokens only. Other tokens are not supported.
          </Typography>
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="flex-end" gap={1}>
        <Button variant="outlined" color="neutral" onClick={closeDialog}>
          Close
        </Button>
      </Stack>
    </Stack>
  );
}
