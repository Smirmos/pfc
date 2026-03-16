import type { Frequency } from '@/lib/calculator';

export interface IncomeItemForm {
  label: string;
  amount: number | null;
  frequency: Frequency;
}

export interface ExpenseItemForm {
  label: string;
  amount: number | null;
  frequency: Frequency;
}

export interface OnboardingFormValues {
  primaryIncome: number | null;
  partnerIncome: number | null;
  incomeItems: IncomeItemForm[];
  rent: number | null;
  debtPayments: number | null;
  expenseItems: ExpenseItemForm[];
  bufferOverride: number | null;
  emergencyFund: number | null;
  savingsTarget: number | null;
}

export const ONBOARDING_DEFAULTS: OnboardingFormValues = {
  primaryIncome: null,
  partnerIncome: null,
  incomeItems: [],
  rent: null,
  debtPayments: null,
  expenseItems: [],
  bufferOverride: null,
  emergencyFund: null,
  savingsTarget: null,
};
