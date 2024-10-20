import { Modal, ModalDialog, ModalDialogProps } from '@mui/joy';
import { useDialog } from '../context/DialogProvider';

export default function Dialog({
  ...props
}: Omit<ModalDialogProps, 'open' | 'onClose'>) {
  const { dialogContent, isOpen } = useDialog();

  if (!isOpen || !dialogContent) {
    return null;
  }

  return (
    <Modal open={isOpen}>
      <ModalDialog variant="plain" {...props}>
        {dialogContent}
      </ModalDialog>
    </Modal>
  );
}
