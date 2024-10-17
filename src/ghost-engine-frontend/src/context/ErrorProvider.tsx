import React, { createContext, useContext, useState, useEffect } from 'react';
import { Stack, Typography } from '@mui/joy';
import NoTextSelect from '../components/NoTextSelect';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [messageKey, setMessageKey] = useState<number>(0);

  useEffect(() => {
    if (errorMessage) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000); // Adjust the duration as needed

      return () => clearTimeout(timer);
    }
  }, [messageKey]);

  const setErrorMessageContent = (message: string) => {
    setErrorMessage(message);
    setMessageKey((prevKey) => prevKey + 1); // Increment key to force update
  };

  return (
    <ErrorMessageContext.Provider
      value={{
        setErrorMessage: setErrorMessageContent,
      }}>
      {children}
      <Stack
        position="absolute"
        top="30%"
        left="50%"
        sx={{
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
        alignItems="center"
        justifyContent="center">
        <NoTextSelect>
          <Typography
            textAlign="center"
            level="h4"
            color="danger"
            sx={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 1s ease-out',
            }}>
            {errorMessage}
          </Typography>
        </NoTextSelect>
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
