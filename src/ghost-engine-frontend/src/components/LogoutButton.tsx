import { IconButton, Stack } from '@mui/joy';
import { useWorld } from '../context/WorldProvider';
import { Logout } from '@mui/icons-material';
import ColorSchemeToggle from './ColorSchemeToggle';

export default function LogoutButton() {
  const { disconnect } = useWorld();

  const handleLogoutClick = () => {
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
