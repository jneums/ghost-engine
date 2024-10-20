import CopyAll from '@mui/icons-material/CopyAll';
import Check from '@mui/icons-material/Check';
import React from 'react';
import { IconButton, Tooltip } from '@mui/joy';

type Props = {
  id: string;
};

export default function CopyId({ id }: Props) {
  const [open, setOpen] = React.useState(false);
  const [copyFeedback, setCopyFeedback] = React.useState('');
  const handleClose = () => {
    setOpen(false);
  };

  const copyToClipBoard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback('ID copied!');
      setOpen(true);
    } catch (err) {
      setCopyFeedback('Failed to copy');
      setOpen(true);
    }
  };

  const CopyIconDisplay = open ? Check : CopyAll;

  return (
    <Tooltip
      open={open}
      variant="plain"
      onClose={handleClose}
      title={copyFeedback}
      leaveDelay={100}
      placement="top">
      <IconButton
        size="sm"
        onClick={() => copyToClipBoard(id)}
        sx={{ p: 0, m: 0, minWidth: 0, minHeight: 0 }}>
        <CopyIconDisplay style={{ display: 'block', fontSize: '14px' }} />
      </IconButton>
    </Tooltip>
  );
}
