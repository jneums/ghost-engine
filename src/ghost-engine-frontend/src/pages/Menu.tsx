import { GitHub } from '@mui/icons-material';
import { Button, Container, IconButton, Stack, Typography } from '@mui/joy';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <Container maxWidth="md" sx={{ height: '100%' }}>
      <Stack justifyContent="center" alignItems="center" height="100%">
        <Stack gap={3}>
          <Stack gap={1}>
            <Typography level="h2">ICRC1 Gathering Demo</Typography>
            <Typography level="body-md">
              A real-time resource gathering game running on the Internet
              Computer using an authoritative server. Running the simulation on
              the blockchain allows for a secure and fair game experience where
              cheating is impossible.
            </Typography>
          </Stack>
          <Button
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
              <GitHub sx={{ width: '20px', height: '20px' }} />
              <Typography level="body-sm" sx={{ ml: 1 }}>
                Fork this project on GitHub
              </Typography>
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
