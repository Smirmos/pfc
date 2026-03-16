export type VulnerabilityBucket =
  | 'high_buffer'
  | 'moderate_buffer'
  | 'tight_buffer'
  | 'overextended';

export type EmergencyFundLevel = 'critical' | 'low' | 'adequate' | 'strong';

export interface Warning {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface Assumptions {
  buffer_source: 'default_17.5pct' | 'user_defined';
  emergency_fund_level: EmergencyFundLevel;
  calculation_version: string;
  pre_purchase_free_cash: number; // cents
  pre_purchase_vulnerability: VulnerabilityBucket;
}

export interface AnalysisResult {
  id: string;
  caseId: string;
  inputVersion: number;
  score: number;
  projectedFreeCashCents: number;
  monthlyBurdenCents: number;
  totalLongTermCostCents: number;
  opportunityCostCents: number;
  vulnerabilityBucket: VulnerabilityBucket;
  warningsJson: Warning[];
  assumptionsJson: Assumptions;
  calculationVersion: string;
  createdAt: string;
  disclaimer: string;
}

export interface ScenarioDelta {
  score: number;
  monthly_burden: number;
  projected_free_cash: number;
  total_long_term_cost: number;
}

export interface ScenarioRow {
  id: string;
  resultId: string;
  label: string;
  scenarioType: string;
  score: number;
  freeCashCents: number;
  monthlyBurdenCents: number;
  totalCostCents: number;
  delta_vs_base: ScenarioDelta;
}

export interface AnalysisCase {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'deleted';
}

export const BUCKET_COLORS: Record<VulnerabilityBucket, string> = {
  high_buffer: '#2e7d32',
  moderate_buffer: '#f59e0b',
  tight_buffer: '#e65100',
  overextended: '#c62828',
};

export const BUCKET_LABELS: Record<VulnerabilityBucket, string> = {
  high_buffer: 'High Buffer',
  moderate_buffer: 'Moderate Buffer',
  tight_buffer: 'Tight Buffer',
  overextended: 'Overextended',
};

export const EMERGENCY_LABELS: Record<EmergencyFundLevel, string> = {
  critical: 'Critical',
  low: 'Low',
  adequate: 'Adequate',
  strong: 'Strong',
};

export function cents(value: number): string {
  return (value / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function centsExact(value: number): string {
  return (value / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
