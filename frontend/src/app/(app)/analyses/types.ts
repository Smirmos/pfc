import type { AnalysisSummary, VulnerabilityBucket } from '../dashboard/types';

export type { AnalysisSummary, VulnerabilityBucket };

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'score_high'
  | 'score_low'
  | 'name_az'
  | 'name_za';

export interface AnalysesStats {
  highest_score: number | null;
  average_score: number | null;
  active_burdens_count: number;
}

export interface PaginatedAnalyses {
  data: AnalysisSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  stats?: AnalysesStats;
}

export const SORT_CONFIG: Record<SortOption, { label: string; param: string }> =
  {
    newest: { label: 'Newest first', param: 'created_at:desc' },
    oldest: { label: 'Oldest first', param: 'created_at:asc' },
    score_high: { label: 'Highest score', param: 'score:desc' },
    score_low: { label: 'Lowest score', param: 'score:asc' },
    name_az: { label: 'Name A\u2013Z', param: 'name:asc' },
    name_za: { label: 'Name Z\u2013A', param: 'name:desc' },
  };

export const CATEGORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'vehicle', label: '\u{1F697} Vehicle' },
  { value: 'home', label: '\u{1F3E0} Home' },
  { value: 'appliance', label: '\u{1F4F1} Appliance' },
  { value: 'other', label: '\u{1F4E6} Other' },
] as const;

export const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;
