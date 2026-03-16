import {
  calculateAffordability,
  ProfileSnapshot,
  AnalysisInputPayload,
} from './engine';

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
  insurance_monthly_cents: 0,
  maintenance_monthly_cents: 0,
  extra_monthly_costs_cents: 0,
  cash_price_cents: 3_500_000,
  fees_cents: 0,
  term_months: 60,
  balloon_payment_cents: 0,
  is_variable_rate: false,
};

describe('calculateAffordability', () => {
  // ── Score tests ───────────────────────────────────────────────────

  it('financed purchase: HIGH_TOTAL_COST penalty fires, score ~27', () => {
    const result = calculateAffordability(baseProfile, baseInputs);

    expect(result.new_monthly_burden).toBe(68_250);
    expect(result.projected_free_cash).toBe(205_500);

    // base_score = (205500 / 550000) * 100 = 37.36
    // total_long_term_cost = 3500000 + 68250*60 = 7595000 > 4550000 (1.3x) → -10
    // penalties = [0, 0, 0, -10, 0]
    // score = round(37.36 - 10) = 27
    expect(result.penalties).toEqual([0, 0, 0, -10, 0]);
    expect(result.score).toBe(27);
  });

  it('zero penalties when cash-only purchase (no financing cost markup)', () => {
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 0,
      cash_price_cents: 10_000_000,
      fees_cents: 0,
      term_months: 60,
      balloon_payment_cents: 0,
      is_variable_rate: false,
      extra_monthly_costs_cents: 0,
    };
    // total_long_term_cost = 10000000, 1.3x = 13000000 → no penalty
    const result = calculateAffordability(baseProfile, inputs);

    // base_score = (273750 / 550000) * 100 = 49.77 → 50
    expect(result.score).toBe(50);
    expect(result.penalties).toEqual([0, 0, 0, 0, 0]);
  });

  it('balloon penalty: score drops exactly 20 points from balloon', () => {
    const withBalloon: AnalysisInputPayload = {
      ...baseInputs,
      balloon_payment_cents: 500_000,
    };
    const without = calculateAffordability(baseProfile, baseInputs);
    const withB = calculateAffordability(baseProfile, withBalloon);

    // Balloon adds -20, but total_long_term_cost changes too.
    // Without balloon: total = 3500000 + 68250*60 = 7595000, > 4550000 -> -10
    // With balloon: total = 3500000 + 68250*60 + 500000 = 8095000, > 4550000 -> -10
    // Both have the same HIGH_TOTAL_COST penalty, so the only difference is balloon -20
    expect(withB.penalties[1]).toBe(-20);
    expect(without.penalties[1]).toBe(0);

    // Same base score, same other penalties → difference is exactly 20
    const penaltyDiff =
      without.penalties.reduce((a, b) => a + b, 0) -
      withB.penalties.reduce((a, b) => a + b, 0);
    expect(penaltyDiff).toBe(20);
  });

  it('variable rate: score drops exactly 10 points', () => {
    const withVariable: AnalysisInputPayload = {
      ...baseInputs,
      is_variable_rate: true,
    };
    const without = calculateAffordability(baseProfile, baseInputs);
    const withV = calculateAffordability(baseProfile, withVariable);

    expect(withV.penalties[2]).toBe(-10);
    expect(without.penalties[2]).toBe(0);
  });

  it('overextended: projected_free_cash negative -> score clamped to 0', () => {
    const overextended: AnalysisInputPayload = {
      ...baseInputs,
      monthly_payment_cents: 400_000, // way more than free cash
    };
    const result = calculateAffordability(baseProfile, overextended);

    expect(result.projected_free_cash).toBeLessThan(0);
    expect(result.score).toBe(0);
    expect(result.penalties[4]).toBe(-10); // overextended penalty
  });

  it('zero income: score = 0, no division by zero', () => {
    const zeroIncome: ProfileSnapshot = {
      ...baseProfile,
      total_income: 0,
      current_free_cash: 0,
    };
    const result = calculateAffordability(zeroIncome, baseInputs);

    expect(result.score).toBe(0);
    expect(result.projected_vulnerability_bucket).toBe('overextended');
  });

  it('score is clamped to max 100', () => {
    // High free cash relative to burden
    const richProfile: ProfileSnapshot = {
      ...baseProfile,
      total_income: 10_000_000,
      current_free_cash: 9_000_000,
      emergency_months: 24,
    };
    const tinyInputs: AnalysisInputPayload = {
      monthly_payment_cents: 100,
      cash_price_cents: 100_000,
      term_months: 12,
    };
    const result = calculateAffordability(richProfile, tinyInputs);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  // ── Monthly burden ────────────────────────────────────────────────

  it('monthly burden sums all components', () => {
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 50_000,
      insurance_monthly_cents: 10_000,
      maintenance_monthly_cents: 5_000,
      extra_monthly_costs_cents: 3_000,
    };
    const result = calculateAffordability(baseProfile, inputs);
    expect(result.new_monthly_burden).toBe(68_000);
  });

  it('monthly burden treats undefined components as 0', () => {
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 50_000,
    };
    const result = calculateAffordability(baseProfile, inputs);
    expect(result.new_monthly_burden).toBe(50_000);
  });

  // ── Total long-term cost ──────────────────────────────────────────

  it('total_long_term_cost includes all components', () => {
    const inputs: AnalysisInputPayload = {
      cash_price_cents: 1_000_000,
      fees_cents: 50_000,
      monthly_payment_cents: 20_000,
      extra_monthly_costs_cents: 5_000,
      term_months: 24,
      balloon_payment_cents: 200_000,
    };
    const result = calculateAffordability(baseProfile, inputs);
    // 1000000 + 50000 + 20000*24 + 5000*24 + 200000 = 1000000 + 50000 + 480000 + 120000 + 200000 = 1850000
    expect(result.total_long_term_cost).toBe(1_850_000);
  });

  it('term defaults to duration_months when term_months is absent', () => {
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 10_000,
      duration_months: 36,
    };
    const result = calculateAffordability(baseProfile, inputs);
    // total includes 10000 * 36 = 360000
    expect(result.total_long_term_cost).toBe(360_000);
  });

  it('term defaults to 12 when both are absent', () => {
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 10_000,
    };
    const result = calculateAffordability(baseProfile, inputs);
    expect(result.total_long_term_cost).toBe(120_000);
  });

  // ── Opportunity cost ──────────────────────────────────────────────

  it('opportunity cost: pmt=68300, rate=7%/12, term=60', () => {
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 68_300,
      term_months: 60,
    };
    const result = calculateAffordability(baseProfile, inputs);

    // FV = 68300 * ((1 + 0.07/12)^60 - 1) / (0.07/12)
    const r = 0.07 / 12;
    const expected = 68_300 * ((Math.pow(1 + r, 60) - 1) / r);
    expect(result.opportunity_cost).toBeCloseTo(expected, 2);
  });

  it('opportunity cost: term=0 -> 0 (no division by zero)', () => {
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 68_300,
      term_months: 0,
    };
    const result = calculateAffordability(baseProfile, inputs);
    expect(result.opportunity_cost).toBe(0);
  });

  // ── Projected vulnerability bucket ────────────────────────────────

  it('high_buffer: projected >= 20% of income', () => {
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 10_000, // small payment
    };
    const result = calculateAffordability(baseProfile, inputs);
    // projected = 273750 - 10000 = 263750, 20% of 550000 = 110000
    expect(result.projected_vulnerability_bucket).toBe('high_buffer');
  });

  it('moderate_buffer: projected >= 10% but < 20% of income', () => {
    const profile: ProfileSnapshot = {
      ...baseProfile,
      current_free_cash: 150_000,
    };
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 80_000,
    };
    // projected = 150000 - 80000 = 70000, 10% = 55000, 20% = 110000
    const result = calculateAffordability(profile, inputs);
    expect(result.projected_vulnerability_bucket).toBe('moderate_buffer');
  });

  it('tight_buffer: projected >= 0 but < 10% of income', () => {
    const profile: ProfileSnapshot = {
      ...baseProfile,
      current_free_cash: 100_000,
    };
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 60_000,
    };
    // projected = 100000 - 60000 = 40000, 10% = 55000
    const result = calculateAffordability(profile, inputs);
    expect(result.projected_vulnerability_bucket).toBe('tight_buffer');
  });

  it('overextended: projected < 0', () => {
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: 300_000,
    };
    const result = calculateAffordability(baseProfile, inputs);
    expect(result.projected_free_cash).toBeLessThan(0);
    expect(result.projected_vulnerability_bucket).toBe('overextended');
  });

  it('overextended: total_income === 0', () => {
    const profile: ProfileSnapshot = {
      ...baseProfile,
      total_income: 0,
    };
    const result = calculateAffordability(profile, baseInputs);
    expect(result.projected_vulnerability_bucket).toBe('overextended');
  });

  // ── Emergency fund level ──────────────────────────────────────────

  it('critical: emergency_months < 3', () => {
    const profile: ProfileSnapshot = { ...baseProfile, emergency_months: 2.5 };
    const result = calculateAffordability(profile, baseInputs);
    expect(result.emergency_fund_level).toBe('critical');
  });

  it('low: emergency_months >= 3 and < 6', () => {
    const profile: ProfileSnapshot = { ...baseProfile, emergency_months: 4.0 };
    const result = calculateAffordability(profile, baseInputs);
    expect(result.emergency_fund_level).toBe('low');
  });

  it('adequate: emergency_months >= 6 and < 9', () => {
    const profile: ProfileSnapshot = { ...baseProfile, emergency_months: 7.0 };
    const result = calculateAffordability(profile, baseInputs);
    expect(result.emergency_fund_level).toBe('adequate');
  });

  it('strong: emergency_months >= 9', () => {
    const profile: ProfileSnapshot = { ...baseProfile, emergency_months: 12.0 };
    const result = calculateAffordability(profile, baseInputs);
    expect(result.emergency_fund_level).toBe('strong');
  });

  // ── Penalty details ───────────────────────────────────────────────

  it('emergency penalty: -15 when < 3 months', () => {
    const profile: ProfileSnapshot = { ...baseProfile, emergency_months: 2.0 };
    const result = calculateAffordability(profile, baseInputs);
    expect(result.penalties[0]).toBe(-15);
  });

  it('no emergency penalty when >= 3 months', () => {
    const result = calculateAffordability(baseProfile, baseInputs);
    expect(result.penalties[0]).toBe(0);
  });

  it('high total cost penalty when > 1.3x cash price', () => {
    const inputs: AnalysisInputPayload = {
      cash_price_cents: 1_000_000,
      monthly_payment_cents: 50_000,
      term_months: 60,
    };
    // total = 1000000 + 50000*60 = 4000000 > 1300000
    const result = calculateAffordability(baseProfile, inputs);
    expect(result.penalties[3]).toBe(-10);
  });

  it('no high total cost penalty when <= 1.3x cash price', () => {
    const inputs: AnalysisInputPayload = {
      cash_price_cents: 10_000_000,
      monthly_payment_cents: 0,
      term_months: 12,
    };
    const result = calculateAffordability(baseProfile, inputs);
    expect(result.penalties[3]).toBe(0);
  });
});

// ── Verification scenario (exact numbers from acceptance criteria) ───
// Profile: income $5,500/mo, rent $1,500, debt $300, emergency $10,000
// Purchase: car $25,000 @ 6%, 60mo ≈ $483/mo + $120 insurance + $80 maintenance
// Baseline: buffer=17.5%, total_fixed=$1,800, free_cash=$2,737.50, emergency_months≈5.56

describe('verification scenario: $25k car at 6% / 60 months', () => {
  const verifyProfile: ProfileSnapshot = {
    total_income: 550_000,
    buffer_reserve: 96_250, // 550000 * 0.175
    buffer_source: 'default_17.5pct',
    total_fixed: 180_000, // rent 150000 + debt 30000
    non_buffer_fixed: 180_000,
    current_free_cash: 273_750, // 550000 - 96250 - 180000
    emergency_months: 5.56, // 1000000 / 180000
    vulnerability_bucket: 'tight_buffer', // 3 ≤ 5.56 < 6
    savings_gap: -173_750,
    savings_gap_status: 'surplus',
  };

  const verifyInputs: AnalysisInputPayload = {
    monthly_payment_cents: 48_300,
    insurance_monthly_cents: 12_000,
    maintenance_monthly_cents: 8_000,
    extra_monthly_costs_cents: 0,
    cash_price_cents: 2_500_000,
    fees_cents: 0,
    term_months: 60,
    balloon_payment_cents: 0,
    is_variable_rate: false,
  };

  it('step 2: monthly_burden_cents = 68300', () => {
    const r = calculateAffordability(verifyProfile, verifyInputs);
    expect(r.new_monthly_burden).toBe(68_300);
  });

  it('step 3: projected_free_cash_cents = 205450', () => {
    const r = calculateAffordability(verifyProfile, verifyInputs);
    expect(r.projected_free_cash).toBe(205_450);
  });

  it('step 4: base ≈ 37.4, HIGH_TOTAL_COST penalty fires, score ≈ 27', () => {
    const r = calculateAffordability(verifyProfile, verifyInputs);
    // base = (205450/550000)*100 = 37.354...
    // total_long_term_cost = 2500000 + 48300*60 = 5398000 > 3250000 (1.3x) → -10
    // No other penalties: emergency ≥ 3, no balloon, not variable, projected ≥ 0
    expect(r.penalties).toEqual([0, 0, 0, -10, 0]);
    expect(r.score).toBe(27); // round(37.354 - 10) = 27
  });

  it('step 5: balloon adds exactly -20 penalty', () => {
    const withBalloon = {
      ...verifyInputs,
      balloon_payment_cents: 500_000,
    };
    const base = calculateAffordability(verifyProfile, verifyInputs);
    const ball = calculateAffordability(verifyProfile, withBalloon);
    expect(ball.penalties[1]).toBe(-20);
    expect(base.score - ball.score).toBe(20);
  });

  it('step 6: variable rate adds exactly -10 penalty', () => {
    const withVar = { ...verifyInputs, is_variable_rate: true };
    const base = calculateAffordability(verifyProfile, verifyInputs);
    const vari = calculateAffordability(verifyProfile, withVar);
    expect(vari.penalties[2]).toBe(-10);
    expect(base.score - vari.score).toBe(10);
  });

  it('step 7a: emergency < 3 months → -15 penalty + CRITICAL', () => {
    // $500 emergency → 50000 / 180000 = 0.28 months
    const lowEmergency = { ...verifyProfile, emergency_months: 0.28 };
    const r = calculateAffordability(lowEmergency, verifyInputs);
    expect(r.penalties[0]).toBe(-15);
    expect(r.emergency_fund_level).toBe('critical');
  });

  it('step 7b: emergency 3-6 months → no -15, level = low', () => {
    // $7000 → 700000 / 180000 = 3.89 months
    const midEmergency = { ...verifyProfile, emergency_months: 3.89 };
    const r = calculateAffordability(midEmergency, verifyInputs);
    expect(r.penalties[0]).toBe(0);
    expect(r.emergency_fund_level).toBe('low');
  });

  it('step 7c: emergency ≥ 9 months → level = strong, no warnings', () => {
    // $20000 → 2000000 / 180000 = 11.11 months
    const highEmergency = { ...verifyProfile, emergency_months: 11.11 };
    const r = calculateAffordability(highEmergency, verifyInputs);
    expect(r.penalties[0]).toBe(0);
    expect(r.emergency_fund_level).toBe('strong');
  });

  it('step 8: savings_gap has zero effect on score', () => {
    const highGap = {
      ...verifyProfile,
      savings_gap: 500_000,
      savings_gap_status: 'shortfall' as const,
    };
    const noGap = {
      ...verifyProfile,
      savings_gap: 0,
      savings_gap_status: 'on_target' as const,
    };
    const r1 = calculateAffordability(highGap, verifyInputs);
    const r2 = calculateAffordability(noGap, verifyInputs);
    expect(r1.score).toBe(r2.score);
  });

  it('step 9: overextended with $2k income → score 0, never negative', () => {
    const poorProfile: ProfileSnapshot = {
      ...verifyProfile,
      total_income: 200_000,
      buffer_reserve: 35_000, // 200000 * 0.175
      current_free_cash: -15_000, // 200000 - 35000 - 180000
      emergency_months: 5.56,
    };
    const r = calculateAffordability(poorProfile, verifyInputs);

    expect(r.projected_free_cash).toBeLessThan(0);
    expect(r.projected_vulnerability_bucket).toBe('overextended');
    expect(r.score).toBe(0);
    expect(r.score).toBeGreaterThanOrEqual(0); // never negative
  });

  it('step 11: emergency_fund_level is low for 5.56 months', () => {
    const r = calculateAffordability(verifyProfile, verifyInputs);
    expect(r.emergency_fund_level).toBe('low');
  });

  it('projected_vulnerability_bucket is high_buffer for this scenario', () => {
    const r = calculateAffordability(verifyProfile, verifyInputs);
    // projected = 205450, 20% of 550000 = 110000 → 205450 ≥ 110000 → high_buffer
    expect(r.projected_vulnerability_bucket).toBe('high_buffer');
  });
});
