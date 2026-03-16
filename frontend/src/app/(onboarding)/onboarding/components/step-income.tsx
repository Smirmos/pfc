'use client';

import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
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
import { FREQUENCIES, FREQUENCY_LABELS } from '@/lib/calculator';
import type { OnboardingFormValues } from '../types';

export default function StepIncome() {
  const { control } = useFormContext<OnboardingFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'incomeItems',
  });

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
        Your Income
      </Typography>

      <Stack spacing={3}>
        <Controller
          name="primaryIncome"
          control={control}
          rules={{
            required: 'Primary income is required',
            min: { value: 0.01, message: 'Must be greater than zero' },
          }}
          render={({ field, fieldState }) => (
            <DollarInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              label="Primary monthly take-home income"
              required
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="partnerIncome"
          control={control}
          render={({ field }) => (
            <DollarInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              label="Partner monthly income (optional)"
            />
          )}
        />
      </Stack>

      <Typography
        variant="subtitle1"
        fontWeight={600}
        sx={{ mt: 4, mb: 2 }}
      >
        Additional income sources
      </Typography>

      <Stack spacing={2}>
        {fields.map((item, index) => (
          <Stack key={item.id} direction="row" spacing={1.5} alignItems="start">
            <Controller
              name={`incomeItems.${index}.label`}
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
              name={`incomeItems.${index}.amount`}
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
              name={`incomeItems.${index}.frequency`}
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
        Add income source
      </Button>
    </Box>
  );
}
