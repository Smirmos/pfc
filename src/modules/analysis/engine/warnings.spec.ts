import {
  calculateAffordability,
  ProfileSnapshot,
  AnalysisInputPayload,
} from './engine';
import { generateWarnings } from './warnings';

const baseProfile: ProfileSnapshot = {
  total_income: 550_000,
  buffer_reserve: 96_250,
  buffer_source: 'default_17.5pct',
  total_fixed: 180_000,
  non_buffer_fixed: 180_000,
  current_free_cash: 273_750,
  emergency_months: 7.0,
  vulnerability_bucket: 'moderate_buffer',
  savings_gap: -173_750,
  savings_gap_status: 'surplus',
};

const baseInputs: AnalysisInputPayload = {
  monthly_payment_cents: 68_250,
  cash_price_cents: 3_500_000,
  term_months: 60,
  balloon_payment_cents: 0,
  is_variable_rate: false,
};

function runWarnings(
  profileOverrides: Partial<ProfileSnapshot> = {},
  inputOverrides: Partial<AnalysisInputPayload> = {},
) {
  const profile = { ...baseProfile, ...profileOverrides };
  const inputs = { ...baseInputs, ...inputOverrides };
  const result = calculateAffordability(profile, inputs);
  return generateWarnings(result, inputs);
}

describe('generateWarnings', () => {
  // ── Emergency fund warnings ───────────────────────────────────────

  it('EMERGENCY_FUND_CRITICAL when emergency_months < 3', () => {
    const warnings = runWarnings({ emergency_months: 2.5 });
    const w = warnings.find((w) => w.code === 'EMERGENCY_FUND_CRITICAL');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('critical');
    expect(w!.message).toContain('less than 3 months');
  });

  it('EMERGENCY_FUND_LOW when emergency_months >= 3 and < 6', () => {
    const warnings = runWarnings({ emergency_months: 4.0 });
    const w = warnings.find((w) => w.code === 'EMERGENCY_FUND_LOW');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('warning');
    expect(w!.message).toContain('6-month target');
    // Should NOT have CRITICAL
    expect(
      warnings.find((w) => w.code === 'EMERGENCY_FUND_CRITICAL'),
    ).toBeUndefined();
  });

  it('no emergency warning when emergency_months >= 6', () => {
    const warnings = runWarnings({ emergency_months: 7.0 });
    expect(
      warnings.find((w) => w.code === 'EMERGENCY_FUND_CRITICAL'),
    ).toBeUndefined();
    expect(
      warnings.find((w) => w.code === 'EMERGENCY_FUND_LOW'),
    ).toBeUndefined();
  });

  // ── Balloon payment warning ───────────────────────────────────────

  it('BALLOON_PAYMENT when balloon > 0', () => {
    const warnings = runWarnings({}, { balloon_payment_cents: 500_000 });
    const w = warnings.find((w) => w.code === 'BALLOON_PAYMENT');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('critical');
    expect(w!.message).toContain('$5,000.00');
  });

  it('no BALLOON_PAYMENT when balloon is 0', () => {
    const warnings = runWarnings({}, { balloon_payment_cents: 0 });
    expect(warnings.find((w) => w.code === 'BALLOON_PAYMENT')).toBeUndefined();
  });

  // ── Variable rate warning ─────────────────────────────────────────

  it('VARIABLE_RATE when is_variable_rate is true', () => {
    const warnings = runWarnings({}, { is_variable_rate: true });
    const w = warnings.find((w) => w.code === 'VARIABLE_RATE');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('warning');
  });

  it('no VARIABLE_RATE when is_variable_rate is false', () => {
    const warnings = runWarnings({}, { is_variable_rate: false });
    expect(warnings.find((w) => w.code === 'VARIABLE_RATE')).toBeUndefined();
  });

  // ── High total cost warning ───────────────────────────────────────

  it('HIGH_TOTAL_COST when total > cash_price * 1.3', () => {
    // base: total = 3500000 + 68250*60 = 7595000, 1.3x = 4550000 -> triggers
    const warnings = runWarnings();
    const w = warnings.find((w) => w.code === 'HIGH_TOTAL_COST');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('warning');
  });

  it('no HIGH_TOTAL_COST when total <= cash_price * 1.3', () => {
    const warnings = runWarnings(
      {},
      {
        cash_price_cents: 10_000_000,
        monthly_payment_cents: 0,
        term_months: 12,
      },
    );
    expect(warnings.find((w) => w.code === 'HIGH_TOTAL_COST')).toBeUndefined();
  });

  // ── Overextended warning ──────────────────────────────────────────

  it('OVEREXTENDED when projected_free_cash < 0', () => {
    const warnings = runWarnings({}, { monthly_payment_cents: 400_000 });
    const w = warnings.find((w) => w.code === 'OVEREXTENDED');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('critical');
  });

  it('no OVEREXTENDED when projected_free_cash >= 0', () => {
    const warnings = runWarnings({}, { monthly_payment_cents: 10_000 });
    expect(warnings.find((w) => w.code === 'OVEREXTENDED')).toBeUndefined();
  });

  // ── Tight buffer post-purchase ────────────────────────────────────

  it('TIGHT_BUFFER_POST when bucket is tight_buffer', () => {
    // projected needs to be >= 0 but < 10% of income (55000)
    const warnings = runWarnings(
      { current_free_cash: 100_000 },
      { monthly_payment_cents: 60_000 },
    );
    // projected = 100000 - 60000 = 40000, 10% of 550000 = 55000 -> tight_buffer
    const w = warnings.find((w) => w.code === 'TIGHT_BUFFER_POST');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('info');
  });

  it('no TIGHT_BUFFER_POST when not tight', () => {
    const warnings = runWarnings({}, { monthly_payment_cents: 10_000 });
    expect(
      warnings.find((w) => w.code === 'TIGHT_BUFFER_POST'),
    ).toBeUndefined();
  });

  // ── Savings shortfall is NOT a warning ────────────────────────────

  it('no warning for savings shortfall', () => {
    const warnings = runWarnings({
      savings_gap: 500_000,
      savings_gap_status: 'shortfall',
    });
    const codes = warnings.map((w) => w.code);
    expect(codes).not.toContain('SAVINGS_SHORTFALL');
    expect(codes).not.toContain('SAVINGS_GAP');
  });
});
