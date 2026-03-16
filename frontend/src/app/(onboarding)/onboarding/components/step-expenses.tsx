'use client';

import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DollarInput from '@/components/ui/dollar-input';
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  normalizeToMonthly,
} from '@/lib/calculator';
import type { OnboardingFormValues } from '../types';

const fmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function useBufferHelperText(): string | null {
  const bufferOverride = useWatch<OnboardingFormValues, 'bufferOverride'>({
    name: 'bufferOverride',
  });
  const primaryIncome = useWatch<OnboardingFormValues, 'primaryIncome'>({
    name: 'primaryIncome',
  });
  const partnerIncome = useWatch<OnboardingFormValues, 'partnerIncome'>({
    name: 'partnerIncome',
  });
  const incomeItems = useWatch<OnboardingFormValues, 'incomeItems'>({
    name: 'incomeItems',
  });

  if (bufferOverride != null) return null;

  const itemIncome = (incomeItems ?? []).reduce(
    (sum, item) =>
      sum + normalizeToMonthly(item?.amount ?? 0, item?.frequency ?? 'monthly'),
    0,
  );
  const total = (primaryIncome ?? 0) + (partnerIncome ?? 0) + itemIncome;
  const buffer = Math.round(total * 0.175 * 100) / 100;

  return `We will use $${fmt.format(buffer)} as your buffer (17.5% of your income)`;
}

export default function StepExpenses() {
  const { control } = useFormContext<OnboardingFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'expenseItems',
  });

  const bufferHelperText = useBufferHelperText();

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
        Your Expenses
      </Typography>

      <Stack spacing={3}>
        <Controller
          name="rent"
          control={control}
          rules={{ required: 'Rent is required', min: { value: 0, message: 'Cannot be negative' } }}
          render={({ field, fieldState }) => (
            <DollarInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              label="Monthly rent / mortgage"
              required
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="debtPayments"
          control={control}
          rules={{ required: 'Debt payments is required', min: { value: 0, message: 'Cannot be negative' } }}
          render={({ field, fieldState }) => (
            <DollarInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              label="Monthly debt payments"
              required
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </Stack>

      <Typography
        variant="subtitle1"
        fontWeight={600}
        sx={{ mt: 4, mb: 2 }}
      >
        Other fixed expenses
      </Typography>

      <Stack spacing={2}>
        {fields.map((item, index) => (
          <Stack key={item.id} direction="row" spacing={1.5} alignItems="start">
            <Controller
              name={`expenseItems.${index}.label`}
              control={control}
              rules={{ required: 'Label required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Label"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ flex: 1 }}
                />
              )}
            />
            <Controller
              name={`expenseItems.${index}.amount`}
              control={control}
              rules={{
                required: 'Amount required',
                min: { value: 0.01, message: 'Must be positive' },
              }}
              render={({ field, fieldState }) => (
                <DollarInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  label="Amount"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ flex: 1 }}
                />
              )}
            />
            <Controller
              name={`expenseItems.${index}.frequency`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Frequency"
                  sx={{ minWidth: 140 }}
                >
                  {FREQUENCIES.map((f) => (
                    <MenuItem key={f} value={f}>
                      {FREQUENCY_LABELS[f]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <IconButton
              onClick={() => remove(index)}
              color="error"
              sx={{ mt: 1 }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      <Button
        startIcon={<AddIcon />}
        onClick={() =>
          append({ label: '', amount: null, frequency: 'monthly' })
        }
        sx={{ mt: 2 }}
      >
        Add expense
      </Button>

      <Typography
        variant="subtitle1"
        fontWeight={600}
        sx={{ mt: 4, mb: 2 }}
      >
        Buffer reserve
      </Typography>

      <Controller
        name="bufferOverride"
        control={control}
        render={({ field }) => (
          <DollarInput
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            label="Monthly buffer override (optional)"
            helperText={bufferHelperText ?? undefined}
          />
        )}
      />
    </Box>
  );
}
