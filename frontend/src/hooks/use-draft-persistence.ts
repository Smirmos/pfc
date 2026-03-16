'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { OnboardingFormValues } from '@/app/(onboarding)/onboarding/types';

const STORAGE_KEY = 'pfa_onboarding_draft';
const DEBOUNCE_MS = 500;

export function useDraftPersistence(form: UseFormReturn<OnboardingFormValues>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<OnboardingFormValues>;
        form.reset({ ...form.getValues(), ...parsed });
      }
    } catch {
      // Ignore corrupt storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft on changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        } catch {
          // Storage full or unavailable
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      clearTimeout(timeoutRef.current);
      subscription.unsubscribe();
    };
  }, [form]);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return { clearDraft };
}
