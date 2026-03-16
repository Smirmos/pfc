/**
 * Scenario generator — pure function, zero side effects.
 * All monetary values in cents.
 */

import {
  calculateAffordability,
  ProfileSnapshot,
  AnalysisInputPayload,
  AffordabilityResult,
} from './engine';

export type ScenarioType =
  | 'BASE'
  | 'HIGHER_DOWN'
  | 'SHORTER_TERM'
  | 'LONGER_TERM'
  | 'RATE_STRESS'
  | 'BUY_OUTRIGHT';

/** Extended inputs including financing details needed for amortisation recalculation. */
export interface ScenarioInput extends AnalysisInputPayload {
  down_payment_cents?: number;
  interest_rate_pct?: number;
  loan_amount_cents?: number;
}

export interface Scenario {
  scenario_type: ScenarioType;
  label: string;
  score: number;
  monthly_burden: number;
  projected_free_cash: number;
  total_long_term_cost: number;
  opportunity_cost: number;
  delta_vs_base: {
    score: number;
    monthly_burden: number;
    projected_free_cash: number;
    total_long_term_cost: number;
    opportunity_cost: number;
  };
}

/** Standard amortisation with optional balloon (all values in cents). */
export function calculateAmortisation(
  principalCents: number,
  annualRate: number,
  termMonths: number,
  balloonCents: number = 0,
): number {
  if (principalCents <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return (principalCents - balloonCents) / termMonths;
  const r = annualRate / 100 / 12;
  const n = termMonths;
  const effectiveP = principalCents - balloonCents / Math.pow(1 + r, n);
  if (effectiveP <= 0) return 0;
  return (effectiveP * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
}

function toEngineInputs(s: ScenarioInput): AnalysisInputPayload {
  return {
    monthly_payment_cents: s.monthly_payment_cents,
    insurance_monthly_cents: s.insurance_monthly_cents,
    maintenance_monthly_cents: s.maintenance_monthly_cents,
    extra_monthly_costs_cents: s.extra_monthly_costs_cents,
    cash_price_cents: s.cash_price_cents,
    fees_cents: s.fees_cents,
    term_months: s.term_months,
    duration_months: s.duration_months,
    balloon_payment_cents: s.balloon_payment_cents,
    is_variable_rate: s.is_variable_rate,
  };
}

function resultToScenario(
  type: ScenarioType,
  label: string,
  result: AffordabilityResult,
  base: AffordabilityResult,
): Scenario {
  const opp = Math.round(result.opportunity_cost);
  const baseOpp = Math.round(base.opportunity_cost);
  return {
    scenario_type: type,
    label,
    score: result.score,
    monthly_burden: result.new_monthly_burden,
    projected_free_cash: result.projected_free_cash,
    total_long_term_cost: result.total_long_term_cost,
    opportunity_cost: opp,
    delta_vs_base: {
      score: result.score - base.score,
      monthly_burden: result.new_monthly_burden - base.new_monthly_burden,
      projected_free_cash:
        result.projected_free_cash - base.projected_free_cash,
      total_long_term_cost:
        result.total_long_term_cost - base.total_long_term_cost,
      opportunity_cost: opp - baseOpp,
    },
  };
}

export function generateScenarios(
  baseInputs: ScenarioInput,
  profile: ProfileSnapshot,
): Scenario[] {
  const cashPrice = baseInputs.cash_price_cents ?? 0;
  const down = baseInputs.down_payment_cents ?? 0;
  const loan = baseInputs.loan_amount_cents ?? Math.max(0, cashPrice - down);
  const rate = baseInputs.interest_rate_pct ?? 0;
  const term = baseInputs.term_months ?? baseInputs.duration_months ?? 12;
  const balloon = baseInputs.balloon_payment_cents ?? 0;

  const baseResult = calculateAffordability(
    profile,
    toEngineInputs(baseInputs),
  );

  // 1. BASE — as entered
  const baseScenario = resultToScenario(
    'BASE',
    'As entered',
    baseResult,
    baseResult,
  );

  // 2. HIGHER_DOWN — +10 percentage points of cash price as additional down
  const newDown = down + Math.round(cashPrice * 0.1);
  const newLoan = Math.max(0, cashPrice - newDown);
  const higherDownInputs: ScenarioInput = {
    ...baseInputs,
    down_payment_cents: newDown,
    loan_amount_cents: newLoan,
    monthly_payment_cents: Math.round(
      calculateAmortisation(newLoan, rate, term, balloon),
    ),
  };
  const higherDownScenario = resultToScenario(
    'HIGHER_DOWN',
    '+10% down payment',
    calculateAffordability(profile, toEngineInputs(higherDownInputs)),
    baseResult,
  );

  // 3. SHORTER_TERM — -20% term (min 1 month)
  const shortTerm = Math.max(1, Math.round(term * 0.8));
  const shorterTermInputs: ScenarioInput = {
    ...baseInputs,
    term_months: shortTerm,
    monthly_payment_cents: Math.round(
      calculateAmortisation(loan, rate, shortTerm, balloon),
    ),
  };
  const shorterTermScenario = resultToScenario(
    'SHORTER_TERM',
    '-20% term',
    calculateAffordability(profile, toEngineInputs(shorterTermInputs)),
    baseResult,
  );

  // 4. LONGER_TERM — +20% term
  const longTerm = Math.round(term * 1.2);
  const longerTermInputs: ScenarioInput = {
    ...baseInputs,
    term_months: longTerm,
    monthly_payment_cents: Math.round(
      calculateAmortisation(loan, rate, longTerm, balloon),
    ),
  };
  const longerTermScenario = resultToScenario(
    'LONGER_TERM',
    '+20% term',
    calculateAffordability(profile, toEngineInputs(longerTermInputs)),
    baseResult,
  );

  // 5. RATE_STRESS — +1 percentage point on interest rate
  const stressedRate = rate + 1;
  const rateStressInputs: ScenarioInput = {
    ...baseInputs,
    interest_rate_pct: stressedRate,
    monthly_payment_cents: Math.round(
      calculateAmortisation(loan, stressedRate, term, balloon),
    ),
  };
  const rateStressScenario = resultToScenario(
    'RATE_STRESS',
    '+1% interest rate',
    calculateAffordability(profile, toEngineInputs(rateStressInputs)),
    baseResult,
  );

  // 6. BUY_OUTRIGHT — no financing, cash upfront
  const buyOutrightInputs: ScenarioInput = {
    ...baseInputs,
    monthly_payment_cents: 0,
    balloon_payment_cents: 0,
    is_variable_rate: false,
  };
  const buyOutrightScenario = resultToScenario(
    'BUY_OUTRIGHT',
    'Buy outright (cash)',
    calculateAffordability(profile, toEngineInputs(buyOutrightInputs)),
    baseResult,
  );

  return [
    baseScenario,
    higherDownScenario,
    shorterTermScenario,
    longerTermScenario,
    rateStressScenario,
    buyOutrightScenario,
  ];
}
