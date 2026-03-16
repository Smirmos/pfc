'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { cents } from '../types';

interface KeyNumbersProps {
  totalLongTermCostCents: number;
  opportunityCostCents: number;
  upfrontRequiredCents: number;
}

export default function KeyNumbers({
  totalLongTermCostCents,
  opportunityCostCents,
  upfrontRequiredCents,
}: KeyNumbersProps) {
  const chips = [
    {
      label: 'Total Long-Term Cost',
      value: cents(totalLongTermCostCents),
      tooltip: null,
    },
    {
      label: 'Opportunity Cost',
      value: cents(opportunityCostCents),
      tooltip:
        'What this money could grow to at 7% annual return over the loan term',
    },
    {
      label: 'Upfront Required',
      value: cents(upfrontRequiredCents),
      tooltip: null,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Key Numbers
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {chips.map((chip) => (
          <Paper
            key={chip.label}
            variant="outlined"
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                mb: 0.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
              >
                {chip.label}
              </Typography>
              {chip.tooltip && (
                <Tooltip title={chip.tooltip} arrow>
                  <InfoOutlinedIcon
                    sx={{ fontSize: 14, color: 'text.secondary' }}
                  />
                </Tooltip>
              )}
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {chip.value}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
