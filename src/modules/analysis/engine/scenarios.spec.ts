import { ProfileSnapshot } from './engine';
import {
  generateScenarios,
  calculateAmortisation,
  ScenarioInput,
  Scenario,
} from './scenarios';

const profile: ProfileSnapshot = {
  total_income: 550_000,
  buffer_reserve: 96_250,
  buffer_source: 'default_17.5pct',
  total_fixed: 180_000,
  non_buffer_fixed: 180_000,
  current_free_cash: 273_750,
  emergency_months: 5.56,
  vulnerability_bucket: 'moderate_buffer',
  savings_gap: -173_750,
  savings_gap_status: 'surplus',
};

// $25k car, 0 down, 6%, 60 months ≈ $483/mo
const baseInputs: ScenarioInput = {
  monthly_payment_cents: 48_300,
  insurance_monthly_cents: 12_000,
  maintenance_monthly_cents: 8_000,
  extra_monthly_costs_cents: 0,
  cash_price_cents: 2_500_000,
  fees_cents: 0,
  term_months: 60,
  balloon_payment_cents: 0,
  is_variable_rate: false,
  down_payment_cents: 0,
  interest_rate_pct: 6,
  loan_amount_cents: 2_500_000,
};

describe('calculateAmortisation', () => {
  it('returns 0 when principal <= 0', () => {
    expect(calculateAmortisation(0, 6, 60)).toBe(0);
    expect(calculateAmortisation(-100, 6, 60)).toBe(0);
  });

  it('returns 0 when term <= 0', () => {
    expect(calculateAmortisation(2_500_000, 6, 0)).toBe(0);
  });

  it('handles zero interest rate (simple division)', () => {
    // $20k / 60 months = $333.33/mo = 33333 cents
    expect(calculateAmortisation(2_000_000, 0, 60)).toBeCloseTo(
      2_000_000 / 60,
      2,
    );
  });

  it('$25k at 6% / 60mo ≈ $483/mo', () => {
    const monthly = calculateAmortisation(2_500_000, 6, 60);
    // Should be close to 48_332 cents ($483.32)
    expect(monthly).toBeGreaterThan(48_000);
    expect(monthly).toBeLessThan(49_000);
  });

  it('matches frontend formula with balloon', () => {
    const monthly = calculateAmortisation(2_500_000, 6, 60, 500_000);
    // With balloon, effective principal is lower → lower payment
    const noBalloon = calculateAmortisation(2_500_000, 6, 60, 0);
    expect(monthly).toBeLessThan(noBalloon);
  });

  it('returns 0 when effective principal <= 0 (huge balloon)', () => {
    expect(calculateAmortisation(100_000, 6, 60, 10_000_000)).toBe(0);
  });
});

describe('generateScenarios', () => {
  let scenarios: Scenario[];

  beforeAll(() => {
    scenarios = generateScenarios(baseInputs, profile);
  });

  it('returns exactly 6 scenarios', () => {
    expect(scenarios).toHaveLength(6);
  });

  it('returns correct scenario types in order', () => {
    const types = scenarios.map((s) => s.scenario_type);
    expect(types).toEqual([
      'BASE',
      'HIGHER_DOWN',
      'SHORTER_TERM',
      'LONGER_TERM',
      'RATE_STRESS',
      'BUY_OUTRIGHT',
    ]);
  });

  // ── BASE ─────────────────────────────────────────────────────────────

  describe('BASE', () => {
    it('matches as-entered inputs', () => {
      const base = scenarios[0];
      expect(base.monthly_burden).toBe(68_300); // 48300 + 12000 + 8000
      expect(base.projected_free_cash).toBe(273_750 - 68_300);
    });

    it('has zero deltas', () => {
      const base = scenarios[0];
      expect(base.delta_vs_base.score).toBe(0);
      expect(base.delta_vs_base.monthly_burden).toBe(0);
      expect(base.delta_vs_base.projected_free_cash).toBe(0);
      expect(base.delta_vs_base.total_long_term_cost).toBe(0);
      expect(base.delta_vs_base.opportunity_cost).toBe(0);
    });
  });

  // ── HIGHER_DOWN ──────────────────────────────────────────────────────

  describe('HIGHER_DOWN', () => {
    it('has lower monthly burden than BASE', () => {
      const base = scenarios[0];
      const higherDown = scenarios[1];
      expect(higherDown.monthly_burden).toBeLessThan(base.monthly_burden);
    });

    it('recalculates payment for +10% of cash price as additional down', () => {
      const higherDown = scenarios[1];
      // newLoan = 2_500_000 - 250_000 = 2_250_000
      const expectedPayment = Math.round(
        calculateAmortisation(2_250_000, 6, 60, 0),
      );
      // monthly_burden = payment + insurance + maintenance
      expect(higherDown.monthly_burden).toBe(expectedPayment + 12_000 + 8_000);
    });

    it('has lower total_long_term_cost than BASE', () => {
      expect(scenarios[1].total_long_term_cost).toBeLessThan(
        scenarios[0].total_long_term_cost,
      );
    });

    it('has negative monthly_burden delta', () => {
      expect(scenarios[1].delta_vs_base.monthly_burden).toBeLessThan(0);
    });
  });

  // ── SHORTER_TERM ─────────────────────────────────────────────────────

  describe('SHORTER_TERM', () => {
    it('uses 80% of original term (48 months)', () => {
      const shorter = scenarios[2];
      // Higher monthly payment but lower total cost
      const expectedPayment = Math.round(
        calculateAmortisation(2_500_000, 6, 48, 0),
      );
      expect(shorter.monthly_burden).toBe(expectedPayment + 12_000 + 8_000);
    });

    it('has higher monthly burden than BASE', () => {
      expect(scenarios[2].monthly_burden).toBeGreaterThan(
        scenarios[0].monthly_burden,
      );
    });

    it('has lower total_long_term_cost than BASE', () => {
      expect(scenarios[2].total_long_term_cost).toBeLessThan(
        scenarios[0].total_long_term_cost,
      );
    });
  });

  // ── LONGER_TERM ──────────────────────────────────────────────────────

  describe('LONGER_TERM', () => {
    it('uses 120% of original term (72 months)', () => {
      const longer = scenarios[3];
      const expectedPayment = Math.round(
        calculateAmortisation(2_500_000, 6, 72, 0),
      );
      expect(longer.monthly_burden).toBe(expectedPayment + 12_000 + 8_000);
    });

    it('has lower monthly burden than BASE', () => {
      expect(scenarios[3].monthly_burden).toBeLessThan(
        scenarios[0].monthly_burden,
      );
    });

    it('has higher total_long_term_cost than BASE', () => {
      expect(scenarios[3].total_long_term_cost).toBeGreaterThan(
        scenarios[0].total_long_term_cost,
      );
    });
  });

  // ── RATE_STRESS ──────────────────────────────────────────────────────

  describe('RATE_STRESS', () => {
    it('recalculates payment at +1% interest', () => {
      const stressed = scenarios[4];
      const expectedPayment = Math.round(
        calculateAmortisation(2_500_000, 7, 60, 0),
      );
      expect(stressed.monthly_burden).toBe(expectedPayment + 12_000 + 8_000);
    });

    it('has higher monthly burden than BASE', () => {
      expect(scenarios[4].monthly_burden).toBeGreaterThan(
        scenarios[0].monthly_burden,
      );
    });

    it('has higher total_long_term_cost than BASE', () => {
      expect(scenarios[4].total_long_term_cost).toBeGreaterThan(
        scenarios[0].total_long_term_cost,
      );
    });
  });

  // ── BUY_OUTRIGHT ─────────────────────────────────────────────────────

  describe('BUY_OUTRIGHT', () => {
    it('has zero loan payment (only insurance + maintenance)', () => {
      const outright = scenarios[5];
      // monthly_burden = 0 + 12000 + 8000 + 0
      expect(outright.monthly_burden).toBe(20_000);
    });

    it('has lowest monthly burden of all scenarios', () => {
      const outright = scenarios[5];
      for (const s of scenarios) {
        expect(outright.monthly_burden).toBeLessThanOrEqual(s.monthly_burden);
      }
    });

    it('has highest projected_free_cash', () => {
      const outright = scenarios[5];
      for (const s of scenarios) {
        expect(outright.projected_free_cash).toBeGreaterThanOrEqual(
          s.projected_free_cash,
        );
      }
    });

    it('has highest score (or tied)', () => {
      const outright = scenarios[5];
      for (const s of scenarios) {
        expect(outright.score).toBeGreaterThanOrEqual(s.score);
      }
    });
  });

  // ── Deltas ───────────────────────────────────────────────────────────

  describe('deltas', () => {
    it('all deltas are relative to BASE', () => {
      const base = scenarios[0];
      for (const s of scenarios) {
        expect(s.delta_vs_base.score).toBe(s.score - base.score);
        expect(s.delta_vs_base.monthly_burden).toBe(
          s.monthly_burden - base.monthly_burden,
        );
        expect(s.delta_vs_base.projected_free_cash).toBe(
          s.projected_free_cash - base.projected_free_cash,
        );
        expect(s.delta_vs_base.total_long_term_cost).toBe(
          s.total_long_term_cost - base.total_long_term_cost,
        );
        expect(s.delta_vs_base.opportunity_cost).toBe(
          s.opportunity_cost - base.opportunity_cost,
        );
      }
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles zero down payment (HIGHER_DOWN still works)', () => {
      const inputs: ScenarioInput = {
        ...baseInputs,
        down_payment_cents: 0,
      };
      const result = generateScenarios(inputs, profile);
      const higherDown = result.find((s) => s.scenario_type === 'HIGHER_DOWN');
      expect(higherDown).toBeDefined();
      expect(higherDown!.monthly_burden).toBeLessThan(result[0].monthly_burden);
    });

    it('handles zero interest rate', () => {
      const inputs: ScenarioInput = {
        ...baseInputs,
        interest_rate_pct: 0,
        monthly_payment_cents: Math.round(2_500_000 / 60),
      };
      const result = generateScenarios(inputs, profile);
      expect(result).toHaveLength(6);
      // RATE_STRESS at 1% should increase the payment
      const stressed = result.find((s) => s.scenario_type === 'RATE_STRESS');
      expect(stressed!.monthly_burden).toBeGreaterThan(
        result[0].monthly_burden,
      );
    });

    it('scores are always 0-100', () => {
      const result = generateScenarios(baseInputs, profile);
      for (const s of result) {
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
      }
    });

    it('SHORTER_TERM term is at least 1 month', () => {
      const shortInputs: ScenarioInput = {
        ...baseInputs,
        term_months: 1,
      };
      const result = generateScenarios(shortInputs, profile);
      // Should not crash even with very short term
      expect(result).toHaveLength(6);
    });

    it('works with existing down payment', () => {
      const inputs: ScenarioInput = {
        ...baseInputs,
        down_payment_cents: 500_000,
        loan_amount_cents: 2_000_000,
        monthly_payment_cents: Math.round(
          calculateAmortisation(2_000_000, 6, 60, 0),
        ),
      };
      const result = generateScenarios(inputs, profile);
      const higherDown = result.find((s) => s.scenario_type === 'HIGHER_DOWN');
      // New down = 500_000 + 250_000 = 750_000, new loan = 1_750_000
      const expectedPayment = Math.round(
        calculateAmortisation(1_750_000, 6, 60, 0),
      );
      expect(higherDown!.monthly_burden).toBe(expectedPayment + 12_000 + 8_000);
    });
  });
});
