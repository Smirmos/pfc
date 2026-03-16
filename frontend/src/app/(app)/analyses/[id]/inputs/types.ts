export type AnalysisCategory = 'vehicle' | 'home' | 'appliance' | 'other';

export interface AnalysisFormValues {
  cashPrice: number | null;
  downPayment: number | null;
  interestRate: number | null;
  termMonths: number | null;
  insuranceMonthly: number | null;
  maintenanceMonthly: number | null;
  fees: number | null;
  isVariableRate: boolean;
  balloonPayment: number | null;
  monthlyRent: number | null;
  upfrontCosts: number | null;
  monthlyExtras: number | null;
  durationMonths: number | null;
  isFinanced: boolean;
  extraMonthlyCosts: number | null;
  notes: string;
}

export const FORM_DEFAULTS: AnalysisFormValues = {
  cashPrice: null,
  downPayment: null,
  interestRate: null,
  termMonths: null,
  insuranceMonthly: null,
  maintenanceMonthly: null,
  fees: null,
  isVariableRate: false,
  balloonPayment: null,
  monthlyRent: null,
  upfrontCosts: null,
  monthlyExtras: null,
  durationMonths: null,
  isFinanced: false,
  extraMonthlyCosts: null,
  notes: '',
};

interface InputPayload {
  cash_price_cents?: number;
  down_payment_cents?: number;
  loan_amount_cents?: number;
  interest_rate_pct?: number;
  term_months?: number;
  monthly_payment_cents?: number;
  insurance_monthly_cents?: number;
  maintenance_monthly_cents?: number;
  fees_cents?: number;
  monthly_rent_cents?: number;
  upfront_costs_cents?: number;
  monthly_extras_cents?: number;
  duration_months?: number;
  balloon_payment_cents?: number;
  is_variable_rate?: boolean;
  extra_monthly_costs_cents?: number;
  notes?: string;
}

function centsToDollars(cents: number | undefined): number | null {
  return cents != null ? cents / 100 : null;
}

function dollarsToCents(dollars: number | null): number | undefined {
  return dollars != null ? Math.round(dollars * 100) : undefined;
}

export function payloadToForm(
  payload: InputPayload | null | undefined,
): Partial<AnalysisFormValues> {
  if (!payload) return {};
  return {
    cashPrice: centsToDollars(payload.cash_price_cents),
    downPayment: centsToDollars(payload.down_payment_cents),
    interestRate: payload.interest_rate_pct ?? null,
    termMonths: payload.term_months ?? null,
    insuranceMonthly: centsToDollars(payload.insurance_monthly_cents),
    maintenanceMonthly: centsToDollars(payload.maintenance_monthly_cents),
    fees: centsToDollars(payload.fees_cents),
    monthlyRent: centsToDollars(payload.monthly_rent_cents),
    upfrontCosts: centsToDollars(payload.upfront_costs_cents),
    monthlyExtras: centsToDollars(payload.monthly_extras_cents),
    durationMonths: payload.duration_months ?? null,
    balloonPayment: centsToDollars(payload.balloon_payment_cents),
    isVariableRate: payload.is_variable_rate ?? false,
    extraMonthlyCosts: centsToDollars(payload.extra_monthly_costs_cents),
    notes: payload.notes ?? '',
  };
}

export function formToPayload(values: AnalysisFormValues): InputPayload {
  const loanAmount = (values.cashPrice ?? 0) - (values.downPayment ?? 0);
  const monthlyPayment = calculateAmortisation(
    loanAmount,
    values.interestRate ?? 0,
    values.termMonths ?? 0,
    values.balloonPayment ?? 0,
  );

  return {
    cash_price_cents: dollarsToCents(values.cashPrice),
    down_payment_cents: dollarsToCents(values.downPayment),
    loan_amount_cents:
      loanAmount > 0 ? Math.round(loanAmount * 100) : undefined,
    interest_rate_pct: values.interestRate ?? undefined,
    term_months: values.termMonths ?? undefined,
    monthly_payment_cents:
      monthlyPayment > 0 ? Math.round(monthlyPayment * 100) : undefined,
    insurance_monthly_cents: dollarsToCents(values.insuranceMonthly),
    maintenance_monthly_cents: dollarsToCents(values.maintenanceMonthly),
    fees_cents: dollarsToCents(values.fees),
    monthly_rent_cents: dollarsToCents(values.monthlyRent),
    upfront_costs_cents: dollarsToCents(values.upfrontCosts),
    monthly_extras_cents: dollarsToCents(values.monthlyExtras),
    duration_months: values.durationMonths ?? undefined,
    balloon_payment_cents: dollarsToCents(values.balloonPayment),
    is_variable_rate: values.isVariableRate || undefined,
    extra_monthly_costs_cents: dollarsToCents(values.extraMonthlyCosts),
    notes: values.notes || undefined,
  };
}

export function calculateAmortisation(
  principal: number,
  annualRate: number,
  termMonths: number,
  balloon: number = 0,
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return (principal - balloon) / termMonths;
  const r = annualRate / 100 / 12;
  const n = termMonths;
  const effectiveP = principal - balloon / Math.pow(1 + r, n);
  if (effectiveP <= 0) return 0;
  return (effectiveP * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
}
