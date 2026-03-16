'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DollarInput from '@/components/ui/dollar-input';
import { calculateAmortisation, type AnalysisFormValues } from '../types';

interface Props {
  onFieldBlur: () => void;
}

export default function VehicleForm({ onFieldBlur }: Props) {
  const { control } = useFormContext<AnalysisFormValues>();

  const price = useWatch({ control, name: 'cashPrice' });
  const downPayment = useWatch({ control, name: 'downPayment' });
  const interestRate = useWatch({ control, name: 'interestRate' });
  const termMonths = useWatch({ control, name: 'termMonths' });
  const balloonPayment = useWatch({ control, name: 'balloonPayment' });
  const isVariableRate = useWatch({ control, name: 'isVariableRate' });

  const loanAmount = (price ?? 0) - (downPayment ?? 0);
  const monthlyPayment = calculateAmortisation(
    loanAmount,
    interestRate ?? 0,
    termMonths ?? 0,
    balloonPayment ?? 0,
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
              required: 'Vehicle price is required',
              min: { value: 0.01, message: 'Must be greater than 0' },
            }}
            render={({ field, fieldState }) => (
              <DollarInput
                label="Vehicle Price"
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

          <DollarInput
            label="Loan Amount"
            value={loanAmount > 0 ? loanAmount : null}
            onChange={() => {}}
            disabled
            helperText="Auto-calculated: Price - Down Payment"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="h6" fontWeight={600}>
            Financing
          </Typography>

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
            value={monthlyPayment > 0 ? Math.round(monthlyPayment * 100) / 100 : null}
            onChange={() => {}}
            disabled
            helperText="Auto-calculated from loan details"
          />

          <Controller
            name="isVariableRate"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      onFieldBlur();
                    }}
                  />
                }
                label="Variable rate"
              />
            )}
          />

          {isVariableRate && (
            <Alert
              severity="warning"
              sx={{
                bgcolor: 'rgba(245, 158, 11, 0.08)',
                color: 'warning.dark',
                '& .MuiAlert-icon': { color: 'warning.main' },
              }}
            >
              Variable rate — your payment may increase
            </Alert>
          )}

          <Controller
            name="balloonPayment"
            control={control}
            render={({ field }) => (
              <DollarInput
                label="Balloon Payment"
                value={field.value}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
                helperText="Final lump-sum payment at end of term"
              />
            )}
          />

          {(balloonPayment ?? 0) > 0 && (
            <Chip
              icon={<WarningAmberIcon />}
              label="Balloon payment detected"
              color="warning"
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="h6" fontWeight={600}>
            Ongoing Costs
          </Typography>

          <Controller
            name="insuranceMonthly"
            control={control}
            render={({ field }) => (
              <DollarInput
                label="Insurance (monthly)"
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
            name="maintenanceMonthly"
            control={control}
            render={({ field }) => (
              <DollarInput
                label="Maintenance (monthly)"
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
            name="fees"
            control={control}
            render={({ field }) => (
              <DollarInput
                label="Fees (one-time)"
                value={field.value}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  onFieldBlur();
                }}
                helperText="Registration, taxes, dealer fees, etc."
              />
            )}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
