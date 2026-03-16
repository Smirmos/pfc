'use client';

import { Controller, useFormContext } from 'react-hook-form';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DollarInput from '@/components/ui/dollar-input';
import type { OnboardingFormValues } from '../types';

export default function StepSafetyNet() {
  const { control } = useFormContext<OnboardingFormValues>();

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Your Safety Net
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        These fields are optional — you can fill them in later from your
        profile.
      </Typography>

      <Stack spacing={3}>
        <Controller
          name="emergencyFund"
          control={control}
          render={({ field }) => (
            <DollarInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              label="Emergency fund balance"
              helperText="Total savings you could access in an emergency"
            />
          )}
        />

        <Controller
          name="savingsTarget"
          control={control}
          render={({ field }) => (
            <DollarInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              label="Monthly savings target"
              helperText="This is a goal — it does not reduce your free cash calculation"
            />
          )}
        />
      </Stack>
    </Box>
  );
}
