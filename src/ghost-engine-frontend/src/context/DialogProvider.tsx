import { ModalDialogProps } from '@mui/joy';
import React, { createContext, useContext, useState } from 'react';
import Dialog from '../ui/Dialog';

type Props = {
  children: React.ReactNode;
};

type DialogContextInterface = {
  isOpen: boolean;
  openDialog: (
    content: React.ReactElement,
    props?: Partial<ModalDialogProps>,
  ) => void;
  closeDialog: () => void;
  dialogContent: React.ReactElement | null;
};

const initialContext: DialogContextInterface = {
  isOpen: false,
  openDialog: () => {},
  closeDialog: () => {},
  dialogContent: <></>,
};

export const DialogContext =
  createContext<DialogContextInterface>(initialContext);

export function DialogProvider({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<React.ReactElement | null>(
    null,
  );
  const [dialogProps, setModalProps] = useState<Partial<ModalDialogProps>>({});

  const openDialog = (
    content: React.ReactElement,
    props?: Partial<ModalDialogProps>,
  ) => {
    setIsOpen(true);
    if (content) {
      setModalProps((prevProps) => ({ ...prevProps, ...(props || {}) }));
      setDialogContent(content);
    }
  };

  const closeDialog = () => {
    setIsOpen(false);
    setDialogContent(null);
  };

  return (
    <DialogContext.Provider
      value={{
        isOpen,
        openDialog,
        closeDialog,
        dialogContent,
      }}>
      <Dialog {...dialogProps} />
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error(
      'You must be within a DialogProvider to use useDialog hook.',
    );
  }

  return context;
}
