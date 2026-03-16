'use client';

import { useRef, useCallback, useState } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import api from '@/lib/axios';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 500;
const SAVED_DISPLAY_MS = 2000;

export function useAutoSave<T extends FieldValues>(
  caseId: string,
  form: UseFormReturn<T>,
  toDto: (values: T) => Record<string, unknown>,
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const triggerSave = useCallback(() => {
    clearTimeout(debounceRef.current);
    clearTimeout(savedTimerRef.current);

    debounceRef.current = setTimeout(async () => {
      const values = form.getValues();
      const dto = toDto(values);
      setSaveStatus('saving');
      try {
        await api.put(`/analyses/${caseId}/inputs`, dto);
        setSaveStatus('saved');
        savedTimerRef.current = setTimeout(
          () => setSaveStatus('idle'),
          SAVED_DISPLAY_MS,
        );
      } catch {
        setSaveStatus('error');
      }
    }, DEBOUNCE_MS);
  }, [caseId, form, toDto]);

  return { triggerSave, saveStatus };
}
