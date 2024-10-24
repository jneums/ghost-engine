import { Modal, ModalDialog, ModalDialogProps, ModalOverflow } from '@mui/joy';
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
      <ModalOverflow>
        <ModalDialog variant="plain" {...props}>
          {dialogContent}
        </ModalDialog>
      </ModalOverflow>
    </Modal>
  );
}
