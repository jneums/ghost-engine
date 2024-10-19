import { IconButton, Stack } from '@mui/joy';
import { Logout } from '@mui/icons-material';
import { useConnection } from '../context/ConnectionProvider';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const { disconnect } = useConnection();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const handleLogoutClick = useCallback(() => {
    if (!identity) {
      throw new Error('Identity not found');
    }
    disconnect(identity);
    navigate('/');
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
