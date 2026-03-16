'use client';

import { useState, useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  calculateBaseline,
  type BaselineSummary,
  type Frequency,
} from '@/lib/calculator';
import type { OnboardingFormValues } from '../types';

const BUCKET_COLORS: Record<BaselineSummary['vulnerabilityBucket'], string> = {
  high_buffer: '#2e7d32', // green
  moderate_buffer: '#f9a825', // amber
  tight_buffer: '#ef6c00', // orange
  overextended: '#c62828', // red
};

const BUCKET_LABELS: Record<BaselineSummary['vulnerabilityBucket'], string> = {
  high_buffer: 'Strong Buffer',
  moderate_buffer: 'Moderate Buffer',
  tight_buffer: 'Tight Buffer',
  overextended: 'Overextended',
};

const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function useDebouncedBaseline(): BaselineSummary | null {
  const values = useWatch<OnboardingFormValues>();
  const [summary, setSummary] = useState<BaselineSummary | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const input = {
        primaryIncome: (values.primaryIncome as number) ?? 0,
        partnerIncome: (values.partnerIncome as number) ?? 0,
        rent: (values.rent as number) ?? 0,
        debtPayments: (values.debtPayments as number) ?? 0,
        emergencyFund: (values.emergencyFund as number) ?? 0,
        savingsTarget: (values.savingsTarget as number) ?? 0,
        bufferAmount: (values.bufferOverride as number | null) ?? null,
        incomeItems: ((values.incomeItems as OnboardingFormValues['incomeItems']) ?? []).map(
          (i) => ({
            amount: i?.amount ?? 0,
            frequency: (i?.frequency ?? 'monthly') as Frequency,
          }),
        ),
        expenseItems: ((values.expenseItems as OnboardingFormValues['expenseItems']) ?? []).map(
          (e) => ({
            amount: e?.amount ?? 0,
            frequency: (e?.frequency ?? 'monthly') as Frequency,
            isFixed: true,
          }),
        ),
      };
      setSummary(calculateBaseline(input));
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  }, [values]);

  return summary;
}

interface SnapshotCardProps {
  compact?: boolean;
}

export default function SnapshotCard({ compact }: SnapshotCardProps) {
  const summary = useDebouncedBaseline();
  const [expanded, setExpanded] = useState(false);

  if (!summary) return null;

  const bucketColor = BUCKET_COLORS[summary.vulnerabilityBucket];
  const savingsStatus = summary.savingsGap <= 0 ? 'On track' : 'Shortfall';

  const content = (
    <>
      <Row label="Total Income" value={fmt.format(summary.totalIncome)} />
      <Row label="Total Fixed" value={fmt.format(summary.totalFixed)} />
      <Divider sx={{ my: 1 }} />
      <Row
        label="Monthly Free Cash"
        value={fmt.format(summary.currentFreeCash)}
        valueColor={bucketColor}
        bold
      />
      <Typography
        variant="caption"
        sx={{
          display: 'inline-block',
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: bucketColor,
          color: '#fff',
          mb: 1,
        }}
      >
        {BUCKET_LABELS[summary.vulnerabilityBucket]}
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Row
        label="Emergency Coverage"
        value={
          summary.emergencyMonths >= 99
            ? 'N/A'
            : `${summary.emergencyMonths} months`
        }
      />
      <Row
        label="Savings Gap"
        value={
          summary.savingsGap <= 0
            ? savingsStatus
            : `${fmt.format(summary.savingsGap)} shortfall`
        }
        valueColor={summary.savingsGap <= 0 ? '#2e7d32' : '#c62828'}
      />
    </>
  );

  if (compact) {
    return (
      <Card
        sx={{
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>
                Free Cash
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ color: bucketColor }}
              >
                {fmt.format(summary.currentFreeCash)}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={expanded}>
            <Box sx={{ mt: 1.5 }}>{content}</Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Financial Snapshot
        </Typography>
        {content}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ py: 0.5 }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={bold ? 700 : 500}
        sx={{ color: valueColor }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
