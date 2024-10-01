import React, { createContext, useContext, useState, useEffect } from 'react';
import { Stack, Typography } from '@mui/joy';

type Props = {
  children: React.ReactNode;
};

type ErrorMessageContextInterface = {
  setErrorMessage: (message: string) => void;
};

const initialContext: ErrorMessageContextInterface = {
  setErrorMessage: () => {},
};

export const ErrorMessageContext =
  createContext<ErrorMessageContextInterface>(initialContext);

export function ErrorMessageProvider({ children }: Props) {
  const [errorMessage, setErrorMessage] = useState<string | null>('TESTING');
  const [visible, setVisible] = useState(false);

  const setErrorMessageContent = (message: string) => {
    setErrorMessage(message);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
    }, 3000); // Adjust the duration as needed
  };

  return (
    <ErrorMessageContext.Provider
      value={{
        setErrorMessage: setErrorMessageContent,
      }}>
      {children}
      <Stack
        position="absolute"
        top="70%"
        left="50%"
        sx={{
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
        alignItems="center"
        justifyContent="center">
        <Typography
          level="h4"
          color="danger"
          sx={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 1s ease-out',
          }}>
          {errorMessage}
        </Typography>
      </Stack>
    </ErrorMessageContext.Provider>
  );
}

export function useErrorMessage() {
  const context = useContext(ErrorMessageContext);

  if (!context) {
    throw new Error(
      'You must be within a ErrorMessageProvider to use useErrorMessage hook.',
    );
  }

  return context;
}
