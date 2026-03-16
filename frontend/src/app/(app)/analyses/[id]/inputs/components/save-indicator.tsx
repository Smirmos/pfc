'use client';

import Chip from '@mui/material/Chip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SyncIcon from '@mui/icons-material/Sync';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { SaveStatus } from '@/hooks/use-auto-save';

const CONFIG: Record<
  Exclude<SaveStatus, 'idle'>,
  { label: string; icon: React.ReactElement; color: 'default' | 'success' | 'error' }
> = {
  saving: { label: 'Saving...', icon: <SyncIcon />, color: 'default' },
  saved: { label: 'Saved', icon: <CheckCircleOutlineIcon />, color: 'success' },
  error: { label: 'Save failed', icon: <ErrorOutlineIcon />, color: 'error' },
};

export default function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  const { label, icon, color } = CONFIG[status];

  return <Chip label={label} icon={icon} color={color} variant="outlined" size="small" />;
}
