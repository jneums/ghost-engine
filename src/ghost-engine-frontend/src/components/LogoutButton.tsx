import { IconButton, Stack } from '@mui/joy';
import { Logout } from '@mui/icons-material';
import ColorSchemeToggle from './ColorSchemeToggle';
import { useConnection } from '../context/ConnectionProvider';
import { useInternetIdentity } from 'ic-use-internet-identity';

export default function LogoutButton() {
  const { disconnect } = useConnection();
  const { identity } = useInternetIdentity();

  const handleLogoutClick = () => {
    if (!identity) {
      throw new Error('Identity not found');
    }
    disconnect();
  };

  return (
    <Stack position="absolute" top={0} right={0} p={2} direction="row" gap={1}>
      <ColorSchemeToggle />
      <IconButton onClick={handleLogoutClick} variant="soft">
        <Logout />
      </IconButton>
    </Stack>
  );
}
