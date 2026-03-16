'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '@/lib/axios';

import ScoreHeader from './components/score-header';
import CashFlowChart from './components/cash-flow-chart';
import BurdenBreakdown from './components/burden-breakdown';
import KeyNumbers from './components/key-numbers';
import WarningsSection from './components/warnings-section';
import ScenarioTable from './components/scenario-table';
import ResultsFooter from './components/results-footer';
import type { AnalysisCase, AnalysisResult, ScenarioRow } from './types';

export default function AnalysisResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');

  // Fetch analysis case (for name + status)
  const caseQuery = useQuery({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const { data } = await api.get(`/analyses/${id}`);
      return data as AnalysisCase & {
        latestInputs: { payload: Record<string, unknown> } | null;
      };
    },
  });

  // Fetch latest result
  const resultQuery = useQuery({
    queryKey: ['analysis-result', id],
    queryFn: async () => {
      const { data } = await api.get(`/analyses/${id}/results/latest`);
      return data as AnalysisResult;
    },
  });

  // Fetch scenarios
  const scenariosQuery = useQuery({
    queryKey: ['analysis-scenarios', id],
    queryFn: async () => {
      const { data } = await api.get(`/analyses/${id}/scenarios`);
      return data as ScenarioRow[];
    },
  });

  // Re-run mutation
  const reRunMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/analyses/${id}/re-run`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-result', id] });
      queryClient.invalidateQueries({ queryKey: ['analysis-scenarios', id] });
      setActionError('');
    },
    onError: () => setActionError('Failed to re-run analysis. Please try again.'),
  });

  // Activate / deactivate toggle
  const toggleMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const endpoint = activate ? 'activate' : 'deactivate';
      const { data } = await api.post(`/analyses/${id}/${endpoint}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis', id] });
      setActionError('');
    },
    onError: () => setActionError('Failed to toggle burden status.'),
  });

  const isLoading =
    resultQuery.isLoading || scenariosQuery.isLoading || caseQuery.isLoading;
  const isError = resultQuery.isError;

  // Error state with retry
  if (isError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                resultQuery.refetch();
                scenariosQuery.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          Failed to load analysis results.
        </Alert>
      </Box>
    );
  }

  // Skeleton loading state
  if (isLoading) {
    return (
      <Box sx={{ py: 2 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={140} height={140} />
                <Skeleton variant="rounded" width={120} height={28} />
                <Skeleton variant="text" width={260} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={160} height={28} />
                <Skeleton variant="rectangular" height={180} sx={{ mt: 1, borderRadius: 2 }} />
              </CardContent>
            </Card>
          </Grid>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width={180} height={28} />
                  <Skeleton variant="rectangular" height={100} sx={{ mt: 1, borderRadius: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const result = resultQuery.data!;
  const scenarios = scenariosQuery.data ?? [];
  const analysisCase = caseQuery.data!;
  const inputs = analysisCase.latestInputs?.payload ?? {};
  const isActive = analysisCase.status === 'active';

  // Derive upfront required from inputs
  const cashPriceCents = (inputs.cash_price_cents as number) ?? 0;
  const feesCents = (inputs.fees_cents as number) ?? 0;
  const downPaymentCents = (inputs.down_payment_cents as number) ?? 0;
  const upfrontCostsCents = (inputs.upfront_costs_cents as number) ?? 0;
  const upfrontRequiredCents =
    (downPaymentCents > 0 ? downPaymentCents : cashPriceCents) +
    feesCents +
    upfrontCostsCents;

  // Derive burden breakdown from inputs
  const monthlyPaymentCents = (inputs.monthly_payment_cents as number) ?? 0;
  const insuranceCents = (inputs.insurance_monthly_cents as number) ?? 0;
  const maintenanceCents = (inputs.maintenance_monthly_cents as number) ?? 0;
  const extraCostsCents = (inputs.extra_monthly_costs_cents as number) ?? 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
        {analysisCase.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Analysis Results
      </Typography>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Section 1 - Score Header */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <ScoreHeader
                score={result.score}
                bucket={result.vulnerabilityBucket}
                projectedFreeCashCents={result.projectedFreeCashCents}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Section 2 - Cash Flow Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <CashFlowChart
                prePurchaseFreeCashCents={
                  result.assumptionsJson.pre_purchase_free_cash
                }
                projectedFreeCashCents={result.projectedFreeCashCents}
                bucket={result.vulnerabilityBucket}
                productName={analysisCase.name}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Section 3 - Monthly Burden Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <BurdenBreakdown
                monthlyPaymentCents={monthlyPaymentCents}
                insuranceCents={insuranceCents}
                maintenanceCents={maintenanceCents}
                extraCostsCents={extraCostsCents}
                totalBurdenCents={result.monthlyBurdenCents}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Section 4 - Key Numbers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <KeyNumbers
                totalLongTermCostCents={result.totalLongTermCostCents}
                opportunityCostCents={result.opportunityCostCents}
                upfrontRequiredCents={upfrontRequiredCents}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Section 5 - Warnings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <WarningsSection warnings={result.warningsJson} />
            </CardContent>
          </Card>
        </Grid>

        {/* Section 6 - Scenario Comparison Table */}
        {scenarios.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ overflow: 'auto' }}>
                <ScenarioTable scenarios={scenarios} />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mt: 3,
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => reRunMutation.mutate()}
          disabled={reRunMutation.isPending}
        >
          {reRunMutation.isPending ? 'Re-running...' : 'Re-run Analysis'}
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Activate Burden
          </Typography>
          <Switch
            checked={isActive}
            onChange={(_, checked) => toggleMutation.mutate(checked)}
            disabled={toggleMutation.isPending}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        <Link
          component="button"
          variant="body2"
          underline="hover"
          onClick={() => router.push('/impulse/new')}
          sx={{ fontWeight: 500 }}
        >
          Run Impulse Check on this
        </Link>
      </Box>

      {/* Footer */}
      <ResultsFooter
        disclaimer={result.disclaimer}
        assumptions={result.assumptionsJson}
      />
    </Box>
  );
}
