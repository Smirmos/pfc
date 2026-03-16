/**
 * Pure affordability engine — zero side effects, no NestJS imports.
 * All monetary values in cents.
 */

export interface ProfileSnapshot {
  total_income: number;
  buffer_reserve: number;
  buffer_source: 'default_17.5pct' | 'user_defined';
  total_fixed: number;
  non_buffer_fixed: number;
  current_free_cash: number;
  emergency_months: number;
  vulnerability_bucket:
    | 'overextended'
    | 'tight_buffer'
    | 'moderate_buffer'
    | 'high_buffer';
  savings_gap: number;
  savings_gap_status: 'surplus' | 'shortfall' | 'on_target';
}

export interface AnalysisInputPayload {
  monthly_payment_cents?: number;
  insurance_monthly_cents?: number;
  maintenance_monthly_cents?: number;
  extra_monthly_costs_cents?: number;
  cash_price_cents?: number;
  fees_cents?: number;
  term_months?: number;
  duration_months?: number;
  balloon_payment_cents?: number;
  is_variable_rate?: boolean;
}

export interface AffordabilityResult {
  score: number;
  new_monthly_burden: number;
  projected_free_cash: number;
  total_long_term_cost: number;
  opportunity_cost: number;
  projected_vulnerability_bucket:
    | 'overextended'
    | 'tight_buffer'
    | 'moderate_buffer'
    | 'high_buffer';
  emergency_fund_level: 'critical' | 'low' | 'adequate' | 'strong';
  penalties: number[];
}

export function calculateAffordability(
  profile: ProfileSnapshot,
  inputs: AnalysisInputPayload,
): AffordabilityResult {
  const new_monthly_burden =
    (inputs.monthly_payment_cents ?? 0) +
    (inputs.insurance_monthly_cents ?? 0) +
    (inputs.maintenance_monthly_cents ?? 0) +
    (inputs.extra_monthly_costs_cents ?? 0);

  const projected_free_cash = profile.current_free_cash - new_monthly_burden;

  const term = inputs.term_months ?? inputs.duration_months ?? 12;

  const total_long_term_cost =
    (inputs.cash_price_cents ?? 0) +
    (inputs.fees_cents ?? 0) +
    (inputs.monthly_payment_cents ?? 0) * term +
    (inputs.extra_monthly_costs_cents ?? 0) * term +
    (inputs.balloon_payment_cents ?? 0);

  // Opportunity cost: future value of monthly burden invested at 7% annual
  const r = 0.07 / 12;
  let opportunity_cost: number;
  if (r === 0 || term === 0) {
    opportunity_cost = new_monthly_burden * term;
  } else {
    opportunity_cost = new_monthly_burden * ((Math.pow(1 + r, term) - 1) / r);
  }

  const base_score =
    profile.total_income === 0
      ? 0
      : (projected_free_cash / profile.total_income) * 100;

  const penalties = [
    profile.emergency_months < 3 ? -15 : 0,
    (inputs.balloon_payment_cents ?? 0) > 0 ? -20 : 0,
    inputs.is_variable_rate ? -10 : 0,
    total_long_term_cost > (inputs.cash_price_cents ?? 0) * 1.3 ? -10 : 0,
    projected_free_cash < 0 ? -10 : 0,
  ];

  const penalty_sum = penalties.reduce((s, p) => s + p, 0);
  const score = Math.max(
    0,
    Math.min(100, Math.round(base_score + penalty_sum)),
  );

  // Projected vulnerability bucket (post-purchase)
  let projected_vulnerability_bucket: AffordabilityResult['projected_vulnerability_bucket'];
  if (profile.total_income === 0) {
    projected_vulnerability_bucket = 'overextended';
  } else if (projected_free_cash >= profile.total_income * 0.2) {
    projected_vulnerability_bucket = 'high_buffer';
  } else if (projected_free_cash >= profile.total_income * 0.1) {
    projected_vulnerability_bucket = 'moderate_buffer';
  } else if (projected_free_cash >= 0) {
    projected_vulnerability_bucket = 'tight_buffer';
  } else {
    projected_vulnerability_bucket = 'overextended';
  }

  // Emergency fund level
  let emergency_fund_level: AffordabilityResult['emergency_fund_level'];
  if (profile.emergency_months < 3) {
    emergency_fund_level = 'critical';
  } else if (profile.emergency_months < 6) {
    emergency_fund_level = 'low';
  } else if (profile.emergency_months < 9) {
    emergency_fund_level = 'adequate';
  } else {
    emergency_fund_level = 'strong';
  }

  return {
    score,
    new_monthly_burden,
    projected_free_cash,
    total_long_term_cost,
    opportunity_cost,
    projected_vulnerability_bucket,
    emergency_fund_level,
    penalties,
  };
}
