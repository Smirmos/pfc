'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import BoltIcon from '@mui/icons-material/Bolt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import api from '@/lib/axios';
import { useAutoSave } from '@/hooks/use-auto-save';
import SaveIndicator from './components/save-indicator';
import VehicleForm from './components/vehicle-form';
import HomeForm from './components/home-form';
import ApplianceForm from './components/appliance-form';
import OtherForm from './components/other-form';
import {
  FORM_DEFAULTS,
  formToPayload,
  payloadToForm,
  type AnalysisCategory,
  type AnalysisFormValues,
} from './types';

export default function AnalysisInputsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromImpulse = searchParams.get('from_impulse');

  const [runError, setRunError] = useState('');
  const [running, setRunning] = useState(false);

  const { data: analysisCase, isLoading } = useQuery({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const { data } = await api.get(`/analyses/${id}`);
      return data as {
        id: string;
        name: string;
        category: AnalysisCategory;
        latestInputs: { payload: Record<string, unknown> } | null;
      };
    },
  });

  const methods = useForm<AnalysisFormValues>({
    defaultValues: FORM_DEFAULTS,
    mode: 'onTouched',
  });

  const toDto = useCallback(
    (values: AnalysisFormValues) => formToPayload(values) as Record<string, unknown>,
    [],
  );

  const { triggerSave, saveStatus } = useAutoSave(id, methods, toDto);

  // Populate form from existing inputs
  useEffect(() => {
    if (analysisCase?.latestInputs?.payload) {
      const restored = payloadToForm(
        analysisCase.latestInputs.payload as Parameters<typeof payloadToForm>[0],
      );
      methods.reset({ ...FORM_DEFAULTS, ...restored });
    }
  }, [analysisCase, methods]);

  const handleRunAnalysis = async () => {
    const valid = await methods.trigger();
    if (!valid) return;

    setRunError('');
    setRunning(true);

    // Save latest inputs before running
    const values = methods.getValues();
    const dto = formToPayload(values);

    try {
      await api.put(`/analyses/${id}/inputs`, dto);
      await api.post(`/analyses/${id}/run`);
      router.push(`/analyses/${id}/results`);
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 501) {
        setRunError('Analysis engine coming soon. Your inputs have been saved.');
      } else {
        setRunError('Failed to run analysis. Please try again.');
      }
    } finally {
      setRunning(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analysisCase) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Analysis not found.
      </Alert>
    );
  }

  const category = analysisCase.category;

  const CATEGORY_LABELS: Record<AnalysisCategory, string> = {
    vehicle: 'Vehicle',
    home: 'Home / Rent',
    appliance: 'Appliance / Tech',
    other: 'Other',
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          {analysisCase.name}
        </Typography>
        <SaveIndicator status={saveStatus} />
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {CATEGORY_LABELS[category]} Analysis
      </Typography>

      {fromImpulse && (
        <Alert
          severity="info"
          icon={<BoltIcon />}
          sx={{
            mb: 3,
            bgcolor: 'rgba(245, 158, 11, 0.08)',
            color: 'warning.dark',
            '& .MuiAlert-icon': { color: 'warning.main' },
          }}
        >
          Upgraded from Impulse Check &mdash; pre-filled from your screenshot
        </Alert>
      )}

      {runError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {runError}
        </Alert>
      )}

      <FormProvider {...methods}>
        {category === 'vehicle' && <VehicleForm onFieldBlur={triggerSave} />}
        {category === 'home' && <HomeForm onFieldBlur={triggerSave} />}
        {category === 'appliance' && <ApplianceForm onFieldBlur={triggerSave} />}
        {category === 'other' && <OtherForm onFieldBlur={triggerSave} />}

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mt: 4,
            mb: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Tooltip title="Coming in next update" arrow>
            <span>
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                disabled
              >
                Upload Documents
              </Button>
            </span>
          </Tooltip>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handleRunAnalysis}
            disabled={running}
          >
            {running ? 'Running...' : 'Run Analysis'}
          </Button>
        </Box>
      </FormProvider>

      <Backdrop
        open={running}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress color="inherit" size={56} />
        <Typography variant="h6" color="inherit">
          Calculating...
        </Typography>
      </Backdrop>
    </Box>
  );
}
