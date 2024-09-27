import { Button, Container, Stack, Typography } from '@mui/joy';
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
    <Container maxWidth="lg" sx={{ height: '100%' }}>
      <Stack justifyContent="center" alignItems="center" height="100%">
        <Stack gap={4}>
          <Stack gap={1}>
            <Typography level="h1">Ghost Engine</Typography>
            <Typography level="body-lg">
              A real-time authoritative game server running 100% on the Internet
              Computer.
            </Typography>
          </Stack>
          <Button
            size="lg"
            variant="outlined"
            disabled={disabled}
            onClick={handleClick}
            id="connect">
            {text}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
