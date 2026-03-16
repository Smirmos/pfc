import { AffordabilityResult, AnalysisInputPayload } from './engine';

export interface Warning {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export function generateWarnings(
  result: AffordabilityResult,
  inputs: AnalysisInputPayload,
): Warning[] {
  const warnings: Warning[] = [];

  if (result.emergency_fund_level === 'critical') {
    warnings.push({
      code: 'EMERGENCY_FUND_CRITICAL',
      severity: 'critical',
      message:
        'Your emergency fund covers less than 3 months of expenses. This purchase increases your risk significantly.',
    });
  } else if (result.emergency_fund_level === 'low') {
    warnings.push({
      code: 'EMERGENCY_FUND_LOW',
      severity: 'warning',
      message: 'Your emergency fund is below the recommended 6-month target.',
    });
  }

  const balloon = inputs.balloon_payment_cents ?? 0;
  if (balloon > 0) {
    const dollars = (balloon / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    warnings.push({
      code: 'BALLOON_PAYMENT',
      severity: 'critical',
      message: `This offer includes a balloon payment of $${dollars} due at the end of the term.`,
    });
  }

  if (inputs.is_variable_rate) {
    warnings.push({
      code: 'VARIABLE_RATE',
      severity: 'warning',
      message:
        'This is a variable rate - your monthly payment may increase over time.',
    });
  }

  const cashPrice = inputs.cash_price_cents ?? 0;
  if (result.total_long_term_cost > cashPrice * 1.3) {
    warnings.push({
      code: 'HIGH_TOTAL_COST',
      severity: 'warning',
      message:
        'The total cost of this purchase is more than 30% above the cash price.',
    });
  }

  if (result.projected_free_cash < 0) {
    warnings.push({
      code: 'OVEREXTENDED',
      severity: 'critical',
      message:
        'This purchase would leave you with negative free cash each month.',
    });
  }

  if (result.projected_vulnerability_bucket === 'tight_buffer') {
    warnings.push({
      code: 'TIGHT_BUFFER_POST',
      severity: 'info',
      message:
        'After this purchase your monthly buffer would be tight (under 10% of income).',
    });
  }

  return warnings;
}
