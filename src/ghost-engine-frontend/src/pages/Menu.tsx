import { GitHub } from '@mui/icons-material';
import { Button, IconButton, Stack, Typography } from '@mui/joy';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorSchemeToggle from '../components/ColorSchemeToggle';

export default function Menu() {
  const navigate = useNavigate();

  const { login, loginStatus, identity } = useInternetIdentity();

  const disabled = loginStatus === 'logging-in' || loginStatus === 'success';
  const text =
    loginStatus === 'logging-in'
      ? 'Logging in...'
      : 'Sign in with Internet Identity';

  useEffect(() => {
    if (identity) {
      navigate('/game');
    }
  }, [identity, navigate]);

  const handleClick = async () => {
    await login();
  };

  return (
    <Stack position="relative" height="100%" width="100%">
      <Stack
        zIndex={-1}
        position="absolute"
        right={0}
        bgcolor="background.level3"
        sx={{
          background: 'url(/planet.webp)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
        height="100%"
        width="100%"
        maxWidth="50%"></Stack>
      <Stack position="absolute" right={0} top={0} padding={2}>
        <ColorSchemeToggle />
      </Stack>
      <Stack
        justifyContent="center"
        height="100%"
        bgcolor="background.surface"
        padding={{ xs: 2, md: 4, lg: 6 }}
        width={{ xs: '100%', sm: '60%', md: '50%' }}>
        <Stack gap={2}>
          <Stack gap={1}>
            <Typography level="h2">ICRC1 Gathering Demo</Typography>
            <Typography level="body-md">
              A real-time resource gathering game running on the Internet
              Computer using an authoritative server. Running the simulation on
              the blockchain allows for a secure and fair game experience that
              eliminates the possibility of cheating.
            </Typography>
          </Stack>
          <Button
            sx={{ maxWidth: '400px' }}
            size="lg"
            disabled={disabled}
            onClick={handleClick}
            id="connect">
            {text}
          </Button>
          <Stack direction="row" alignItems="center">
            <IconButton
              component="a"
              href="https://github.com/jneums/ghost-engine"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none', color: 'inherit' }}>
              <GitHub sx={{ width: '24px', height: '24px' }} />
              <Typography level="body-sm" fontWeight="lg" sx={{ ml: 1 }}>
                View the code on GitHub
              </Typography>
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
