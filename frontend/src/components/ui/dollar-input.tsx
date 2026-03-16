'use client';

import { useState, useCallback, type FocusEvent } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import type { SxProps, Theme } from '@mui/material/styles';

const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatDisplay(value: number | null): string {
  if (value == null || isNaN(value)) return '';
  return formatter.format(value);
}

function parseInput(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

interface DollarInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  label?: string;
  helperText?: React.ReactNode;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  placeholder?: string;
}

export default function DollarInput({
  value,
  onChange,
  onBlur,
  label,
  helperText,
  error,
  required,
  disabled,
  fullWidth = true,
  sx,
  placeholder,
}: DollarInputProps) {
  const [focused, setFocused] = useState(false);
  const [display, setDisplay] = useState(() =>
    value != null ? String(value) : '',
  );

  const handleFocus = useCallback(() => {
    setFocused(true);
    setDisplay(value != null ? String(value) : '');
  }, [value]);

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      const parsed = parseInput(e.target.value);
      onChange(parsed);
      setDisplay(formatDisplay(parsed));
      onBlur?.();
    },
    [onChange, onBlur],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setDisplay(raw);
      const parsed = parseInput(raw);
      onChange(parsed);
    },
    [onChange],
  );

  const displayValue = focused ? display : formatDisplay(value);

  return (
    <TextField
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      label={label}
      helperText={helperText}
      error={error}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      placeholder={placeholder}
      inputMode="decimal"
      sx={sx}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">$</InputAdornment>
        ),
      }}
    />
  );
}
