'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { centsExact } from '../types';

interface BurdenBreakdownProps {
  monthlyPaymentCents: number;
  insuranceCents: number;
  maintenanceCents: number;
  extraCostsCents: number;
  totalBurdenCents: number;
}

export default function BurdenBreakdown({
  monthlyPaymentCents,
  insuranceCents,
  maintenanceCents,
  extraCostsCents,
  totalBurdenCents,
}: BurdenBreakdownProps) {
  const items = [
    { label: 'Monthly Payment', value: monthlyPaymentCents },
    { label: 'Insurance', value: insuranceCents },
    { label: 'Maintenance', value: maintenanceCents },
    { label: 'Extra Monthly Costs', value: extraCostsCents },
  ].filter((item) => item.value > 0);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Monthly Burden Breakdown
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {items.map((item) => (
          <Box
            key={item.label}
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="body2">
              {centsExact(item.value)}
            </Typography>
          </Box>
        ))}
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body1" fontWeight={700}>
            Total
          </Typography>
          <Typography variant="body1" fontWeight={700}>
            {centsExact(totalBurdenCents)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
