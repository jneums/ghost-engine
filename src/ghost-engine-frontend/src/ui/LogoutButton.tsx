import { IconButton, Stack } from '@mui/joy';
import { Logout } from '@mui/icons-material';
import { useConnection } from '../context/ConnectionProvider';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useCallback } from 'react';

export default function LogoutButton() {
  const { disconnect } = useConnection();
  const { identity, clear } = useInternetIdentity();

  const handleLogoutClick = useCallback(() => {
    if (!identity) {
      throw new Error('Identity not found');
    }
    disconnect(identity);
    clear();
  }, [disconnect, identity]);

  return (
    <Stack
      position="absolute"
      bottom={0}
      right={0}
      p={1}
      direction="row"
      sx={{ opacity: 0.7 }}
      gap={1}>
      <IconButton onClick={handleLogoutClick} variant="soft">
        <Logout />
      </IconButton>
    </Stack>
  );
}
