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

export default function HomeForm({ onFieldBlur }: Props) {
  const { control } = useFormContext<AnalysisFormValues>();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="h6" fontWeight={600}>
            Monthly Costs
          </Typography>

          <Controller
            name="monthlyRent"
            control={control}
            rules={{
              required: 'Monthly rent is required',
              min: { value: 0.01, message: 'Must be greater than 0' },
            }}
            render={({ field, fieldState }) => (
              <DollarInput
                label="Monthly Rent"
                value={field.value}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                required
              />
            )}
          />

          <Controller
            name="monthlyExtras"
            control={control}
            render={({ field }) => (
              <DollarInput
                label="Monthly Extras"
                value={field.value}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
                helperText="Utilities, parking, HOA, etc."
              />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="h6" fontWeight={600}>
            Upfront Costs
          </Typography>

          <Controller
            name="downPayment"
            control={control}
            render={({ field }) => (
              <DollarInput
                label="Deposit / Down Payment"
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
            name="upfrontCosts"
            control={control}
            render={({ field }) => (
              <DollarInput
                label="Upfront Costs"
                value={field.value}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
                helperText="Moving costs, first/last month, agent fees, etc."
              />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="h6" fontWeight={600}>
            Duration
          </Typography>

          <Controller
            name="durationMonths"
            control={control}
            render={({ field }) => (
              <TextField
                label="Lease Duration (months)"
                type="number"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
                fullWidth
                InputProps={{ inputProps: { min: 1, step: 1 } }}
                helperText="How long do you plan to stay?"
              />
            )}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
