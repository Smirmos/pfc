'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import api from '@/lib/axios';
import { useDraftPersistence } from '@/hooks/use-draft-persistence';
import { ONBOARDING_DEFAULTS, type OnboardingFormValues } from '../types';
import StepIncome from './step-income';
import StepExpenses from './step-expenses';
import StepSafetyNet from './step-safety-net';
import SnapshotCard from './snapshot-card';

const STEPS = ['Income', 'Expenses', 'Safety Net'];

const STEP_FIELDS: Record<number, (keyof OnboardingFormValues)[]> = {
  0: ['primaryIncome'],
  1: ['rent', 'debtPayments'],
  2: [],
};

export default function OnboardingWizard() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<OnboardingFormValues>({
    defaultValues: ONBOARDING_DEFAULTS,
    mode: 'onTouched',
  });

  const { clearDraft } = useDraftPersistence(methods);

  const handleNext = async () => {
    const fields = STEP_FIELDS[activeStep];
    if (fields && fields.length > 0) {
      const valid = await methods.trigger(fields);
      if (!valid) return;
    }
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async (values: OnboardingFormValues) => {
    setError('');
    setSubmitting(true);
    try {
      await api.put('/me/profile', {
        currency: 'USD',
        primaryIncomeDollars: values.primaryIncome ?? 0,
        partnerIncomeDollars: values.partnerIncome ?? 0,
        rentDollars: values.rent ?? 0,
        debtPaymentsDollars: values.debtPayments ?? 0,
        emergencyFundDollars: values.emergencyFund ?? 0,
        savingsTargetDollars: values.savingsTarget ?? 0,
        bufferAmountDollars:
          values.bufferOverride != null ? values.bufferOverride : null,
      });

      const incomePromises = values.incomeItems
        .filter((i) => i.label && i.amount != null)
        .map((item) =>
          api.post('/me/income-items', {
            label: item.label,
            amountDollars: item.amount,
            frequency: item.frequency,
          }),
        );

      const expensePromises = values.expenseItems
        .filter((e) => e.label && e.amount != null)
        .map((item) =>
          api.post('/me/expense-items', {
            label: item.label,
            amountDollars: item.amount,
            frequency: item.frequency,
            isFixed: true,
          }),
        );

      await Promise.all([...incomePromises, ...expensePromises]);

      clearDraft();
      router.replace('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onComplete = () => {
    methods.handleSubmit(handleSubmit)();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        Set up your finances
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        We'll use this to calculate your financial baseline
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <FormProvider {...methods}>
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {activeStep === 0 && <StepIncome />}
            {activeStep === 1 && <StepExpenses />}
            {activeStep === 2 && <StepSafetyNet />}

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              {activeStep > 0 && (
                <Button variant="outlined" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              {activeStep < STEPS.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <>
                  <Button
                    variant="text"
                    onClick={onComplete}
                    disabled={submitting}
                  >
                    Skip
                  </Button>
                  <Button
                    variant="contained"
                    onClick={onComplete}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Complete Setup'}
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {/* Desktop snapshot panel */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              width: 340,
              flexShrink: 0,
              position: 'sticky',
              top: 24,
              alignSelf: 'flex-start',
            }}
          >
            <SnapshotCard />
          </Box>
        </Box>

        {/* Mobile sticky bottom snapshot */}
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
          }}
        >
          <SnapshotCard compact />
        </Box>
      </FormProvider>
    </Container>
  );
}
