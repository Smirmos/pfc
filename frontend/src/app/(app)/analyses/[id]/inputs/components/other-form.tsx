'use client';

import { useFormContext, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DollarInput from '@/components/ui/dollar-input';
import type { AnalysisFormValues } from '../types';

interface Props {
  onFieldBlur: () => void;
}

export default function OtherForm({ onFieldBlur }: Props) {
  const { control } = useFormContext<AnalysisFormValues>();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="h6" fontWeight={600}>
            Purchase Details
          </Typography>

          <Controller
            name="cashPrice"
            control={control}
            render={({ field }) => (
              <DollarInput
                label="Estimated Cost"
                value={field.value}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
              />
            )}
          />

          <Controller
            name="extraMonthlyCosts"
            control={control}
            render={({ field }) => (
              <DollarInput
                label="Extra Monthly Costs"
                value={field.value}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
                helperText="Any recurring costs associated with this purchase"
              />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="h6" fontWeight={600}>
            Notes
          </Typography>

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                label="Describe your purchase"
                value={field.value}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
                multiline
                rows={5}
                fullWidth
                placeholder="What are you planning to purchase? Include any relevant details..."
              />
            )}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
