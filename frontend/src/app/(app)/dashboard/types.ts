export type VulnerabilityBucket =
  | 'high_buffer'
  | 'moderate_buffer'
  | 'tight_buffer'
  | 'overextended';

export type EmergencyFundLevel = 'critical' | 'low' | 'adequate' | 'strong';

export interface ProfileSummary {
  totalIncomeCents: number;
  bufferReserveCents: number;
  bufferSource: 'default_17.5pct' | 'user_defined';
  totalFixedCents: number;
  currentFreeCashCents: number;
  emergencyFundCents: number;
  emergencyMonths: number;
  savingsTargetCents: number;
  savingsGapCents: number;
  vulnerabilityBucket: VulnerabilityBucket;
}

export interface AnalysisSummary {
  id: string;
  name: string;
  category: 'vehicle' | 'home' | 'appliance' | 'other';
  status: 'active' | 'inactive' | 'deleted';
  score: number | null;
  projected_vulnerability_bucket: VulnerabilityBucket | null;
  monthly_burden_cents: number | null;
  created_at: string;
}

export interface DashboardData {
  profile_summary: ProfileSummary | null;
  recent_analyses: AnalysisSummary[];
  active_burdens: AnalysisSummary[];
  recent_impulse_checks: never[];
  usage: {
    analyses_this_month: number;
    impulse_checks_this_month: number;
  };
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

export const CATEGORY_ICONS: Record<string, string> = {
  vehicle: '\u{1F697}',
  home: '\u{1F3E0}',
  appliance: '\u{1F4F1}',
  other: '\u{1F4E6}',
};

export function cents(value: number): string {
  return (value / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
