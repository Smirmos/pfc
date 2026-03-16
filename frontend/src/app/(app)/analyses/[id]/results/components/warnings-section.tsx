'use client';

import Box from '@mui/material/Box';
import Alert, { type AlertColor } from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import type { Warning } from '../types';

interface WarningsSectionProps {
  warnings: Warning[];
}

const SEVERITY_MAP: Record<Warning['severity'], AlertColor> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

export default function WarningsSection({ warnings }: WarningsSectionProps) {
  if (warnings.length === 0) {
    return (
      <Box>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
          Warnings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No significant warnings
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Warnings
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {warnings.map((w) => (
          <Alert key={w.code} severity={SEVERITY_MAP[w.severity]}>
            {w.message}
          </Alert>
        ))}
      </Box>
    </Box>
  );
}
