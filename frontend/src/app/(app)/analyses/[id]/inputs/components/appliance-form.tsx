'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DollarInput from '@/components/ui/dollar-input';
import { calculateAmortisation, type AnalysisFormValues } from '../types';

interface Props {
  onFieldBlur: () => void;
}

export default function ApplianceForm({ onFieldBlur }: Props) {
  const { control } = useFormContext<AnalysisFormValues>();

  const isFinanced = useWatch({ control, name: 'isFinanced' });
  const cashPrice = useWatch({ control, name: 'cashPrice' });
  const downPayment = useWatch({ control, name: 'downPayment' });
  const interestRate = useWatch({ control, name: 'interestRate' });
  const termMonths = useWatch({ control, name: 'termMonths' });

  const loanAmount = (cashPrice ?? 0) - (downPayment ?? 0);
  const monthlyPayment = calculateAmortisation(
    loanAmount,
    interestRate ?? 0,
    termMonths ?? 0,
  );

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
            rules={{
              required: 'Price is required',
              min: { value: 0.01, message: 'Must be greater than 0' },
            }}
            render={({ field, fieldState }) => (
              <DollarInput
                label="Cash Price"
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
            name="isFinanced"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      onFieldBlur();
                    }}
                  />
                }
                label="Finance this purchase"
              />
            )}
          />
        </CardContent>
      </Card>

      {isFinanced && (
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="h6" fontWeight={600}>
              Financing Details
            </Typography>

            <Controller
              name="downPayment"
              control={control}
              render={({ field }) => (
                <DollarInput
                  label="Down Payment"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={() => {
                    field.onBlur();
                    onFieldBlur();
                  }}
                />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="interestRate"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Interest Rate (%)"
                    type="number"
                    inputMode="decimal"
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
                    InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                  />
                )}
              />

              <Controller
                name="termMonths"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Term (months)"
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
                  />
                )}
              />
            </Box>

            <DollarInput
              label="Monthly Payment"
              value={
                monthlyPayment > 0
                  ? Math.round(monthlyPayment * 100) / 100
                  : null
              }
              onChange={() => {}}
              disabled
              helperText="Auto-calculated from financing details"
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
