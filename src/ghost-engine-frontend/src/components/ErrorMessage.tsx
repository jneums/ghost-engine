import { Stack, Typography } from '@mui/joy';

export default function ErrorMessage() {
  // const { error } = useError();

  return (
    <Stack
      position="absolute"
      top="70%"
      left="50%"
      sx={{ transform: 'translate(-50%, -50%)' }}
      alignItems="center"
      justifyContent="center">
      <Typography level="h4" color="danger">
        {'TESTING!!'}
      </Typography>
    </Stack>
  );
}
