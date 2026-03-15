import {
  calculateBaseline,
  normalizeToMonthly,
  BaselineInput,
  Frequency,
} from './baseline-calculator';

describe('normalizeToMonthly', () => {
  it('monthly returns amount unchanged', () => {
    expect(normalizeToMonthly(100_000, 'monthly')).toBe(100_000);
  });

  it('annual divides by 12 (rounded)', () => {
    expect(normalizeToMonthly(1_200_000, 'annual')).toBe(100_000);
    // 1_000_000 / 12 = 83333.33 → 83333
    expect(normalizeToMonthly(1_000_000, 'annual')).toBe(83_333);
  });

  it('weekly multiplies by 52/12 (rounded)', () => {
    // 10000 * 52 / 12 = 43333.33 → 43333
    expect(normalizeToMonthly(10_000, 'weekly')).toBe(43_333);
  });

  it('biweekly multiplies by 26/12 (rounded)', () => {
    // 50000 * 26 / 12 = 108333.33 → 108333
    expect(normalizeToMonthly(50_000, 'biweekly')).toBe(108_333);
  });
});

describe('calculateBaseline', () => {
  const base: BaselineInput = {
    primaryIncomeCents: 0,
    rentCents: 0,
    debtPaymentsCents: 0,
    emergencyFundCents: 0,
    savingsTargetCents: 0,
    bufferAmountCents: null,
    incomeItems: [],
    expenseItems: [],
  };

  const monthlyIncome = (c: number) => ({
    amountCents: c,
    frequency: 'monthly' as Frequency,
  });
  const annualIncome = (c: number) => ({
    amountCents: c,
    frequency: 'annual' as Frequency,
  });
  const monthlyFixed = (c: number) => ({
    amountCents: c,
    frequency: 'monthly' as Frequency,
    isFixed: true,
  });
  const monthlyVariable = (c: number) => ({
    amountCents: c,
    frequency: 'monthly' as Frequency,
    isFixed: false,
  });

  // ── Vulnerability bucket tests (thresholds: <3, 3-6, 6-9, ≥9) ──

  describe('overextended bucket (emergencyMonths < 3)', () => {
    it('should return overextended when emergency fund covers < 3 months of fixed', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        emergencyFundCents: 300_000, // $3,000 fund / $1,800 fixed = 1.67 months
      });

      expect(result.totalFixedCents).toBe(180_000);
      expect(result.emergencyMonths).toBe(1.67);
      expect(result.vulnerabilityBucket).toBe('overextended');
    });

    it('should return overextended with zero emergency fund', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 500_000,
        rentCents: 200_000,
        emergencyFundCents: 0,
      });

      expect(result.emergencyMonths).toBe(0);
      expect(result.vulnerabilityBucket).toBe('overextended');
    });
  });

  describe('tight_buffer bucket (3 <= emergencyMonths < 6)', () => {
    it('should return tight_buffer when fund covers 3-6 months', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        emergencyFundCents: 1_000_000, // $10,000 / $1,800 = 5.56
      });

      expect(result.totalFixedCents).toBe(180_000);
      expect(result.emergencyMonths).toBe(5.56);
      expect(result.vulnerabilityBucket).toBe('tight_buffer');
    });

    it('should return tight_buffer at exactly 3 months', () => {
      // 540_000 / 180_000 = 3.0
      const result = calculateBaseline({
        ...base,
        rentCents: 180_000,
        emergencyFundCents: 540_000,
      });

      expect(result.emergencyMonths).toBe(3);
      expect(result.vulnerabilityBucket).toBe('tight_buffer');
    });
  });

  describe('moderate_buffer bucket (6 <= emergencyMonths < 9)', () => {
    it('should return moderate_buffer when fund covers 6-9 months', () => {
      // 1_400_000 / 200_000 = 7.0
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 800_000,
        rentCents: 150_000,
        debtPaymentsCents: 50_000,
        emergencyFundCents: 1_400_000,
      });

      expect(result.totalFixedCents).toBe(200_000);
      expect(result.emergencyMonths).toBe(7);
      expect(result.vulnerabilityBucket).toBe('moderate_buffer');
    });

    it('should return moderate_buffer at exactly 6 months', () => {
      // 900_000 / 150_000 = 6.0
      const result = calculateBaseline({
        ...base,
        rentCents: 150_000,
        emergencyFundCents: 900_000,
      });

      expect(result.emergencyMonths).toBe(6);
      expect(result.vulnerabilityBucket).toBe('moderate_buffer');
    });
  });

  describe('high_buffer bucket (emergencyMonths >= 9)', () => {
    it('should return high_buffer when fund covers >= 9 months', () => {
      // 2_000_000 / 180_000 = 11.11
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        emergencyFundCents: 2_000_000,
      });

      expect(result.emergencyMonths).toBe(11.11);
      expect(result.vulnerabilityBucket).toBe('high_buffer');
    });

    it('should return high_buffer at exactly 9 months', () => {
      // 1_800_000 / 200_000 = 9.0
      const result = calculateBaseline({
        ...base,
        rentCents: 200_000,
        emergencyFundCents: 1_800_000,
      });

      expect(result.emergencyMonths).toBe(9);
      expect(result.vulnerabilityBucket).toBe('high_buffer');
    });
  });

  // ── Buffer source ─────────────────────────────────────────────────

  describe('buffer source', () => {
    it('should use default 17.5% when bufferAmountCents is null', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 1_000_000,
        bufferAmountCents: null,
      });

      expect(result.bufferReserveCents).toBe(175_000); // 1_000_000 * 0.175
      expect(result.bufferSource).toBe('default_17.5pct');
    });

    it('should use user-defined buffer when bufferAmountCents is set', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 1_000_000,
        bufferAmountCents: 50_000,
      });

      expect(result.bufferReserveCents).toBe(50_000);
      expect(result.bufferSource).toBe('user_defined');
    });

    it('should allow zero as a user-defined buffer', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 500_000,
        bufferAmountCents: 0,
      });

      expect(result.bufferReserveCents).toBe(0);
      expect(result.bufferSource).toBe('user_defined');
    });
  });

  // ── Income aggregation ────────────────────────────────────────────

  describe('total income', () => {
    it('should sum primaryIncome and monthly income items', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        incomeItems: [monthlyIncome(100_000)],
      });

      expect(result.totalIncomeCents).toBe(650_000);
    });

    it('should normalize annual income items to monthly', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        incomeItems: [annualIncome(1_200_000)], // 1_200_000 / 12 = 100_000
      });

      expect(result.totalIncomeCents).toBe(650_000);
    });

    it('should aggregate multiple income items of different frequencies', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 400_000,
        incomeItems: [
          monthlyIncome(100_000),
          annualIncome(120_000), // 10_000/month
          { amountCents: 20_000, frequency: 'weekly' as Frequency }, // ~86_667/month
          { amountCents: 30_000, frequency: 'biweekly' as Frequency }, // 65_000/month
        ],
      });

      // 400_000 + 100_000 + 10_000 + 86_667 + 65_000 = 661_667
      expect(result.totalIncomeCents).toBe(661_667);
    });
  });

  // ── Fixed expenses aggregation ────────────────────────────────────

  describe('total fixed', () => {
    it('should sum rent + debt + fixed expense items', () => {
      const result = calculateBaseline({
        ...base,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        expenseItems: [monthlyFixed(50_000)],
      });

      expect(result.totalFixedCents).toBe(230_000);
    });

    it('should ignore variable expense items in totalFixed', () => {
      const result = calculateBaseline({
        ...base,
        rentCents: 100_000,
        expenseItems: [monthlyFixed(50_000), monthlyVariable(200_000)],
      });

      expect(result.totalFixedCents).toBe(150_000);
    });

    it('should normalize annual fixed expense items', () => {
      const result = calculateBaseline({
        ...base,
        rentCents: 100_000,
        expenseItems: [
          {
            amountCents: 120_000,
            frequency: 'annual' as Frequency,
            isFixed: true,
          }, // 10_000/month
        ],
      });

      expect(result.totalFixedCents).toBe(110_000);
    });
  });

  // ── Free cash calculation ─────────────────────────────────────────

  describe('current free cash', () => {
    it('should compute income - buffer - fixed', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        bufferAmountCents: null, // 17.5% of 550_000 = 96_250
      });

      // 550_000 - 96_250 - 180_000 = 273_750
      expect(result.currentFreeCashCents).toBe(273_750);
    });

    it('should allow negative free cash when overcommitted', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 300_000,
        rentCents: 250_000,
        debtPaymentsCents: 100_000,
        bufferAmountCents: null, // 52_500
      });

      // 300_000 - 52_500 - 350_000 = -102_500
      expect(result.currentFreeCashCents).toBe(-102_500);
    });
  });

  // ── Savings gap ───────────────────────────────────────────────────

  describe('savings gap', () => {
    it('should compute savingsTarget - currentFreeCash (positive = shortfall)', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        savingsTargetCents: 600_000,
        bufferAmountCents: null, // buffer = 96_250, freeCash = 273_750
      });

      // 600_000 - 273_750 = 326_250 (shortfall)
      expect(result.savingsGapCents).toBe(326_250);
    });

    it('should be negative when free cash exceeds target (surplus)', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 1_000_000,
        rentCents: 100_000,
        savingsTargetCents: 200_000,
        bufferAmountCents: 50_000, // freeCash = 1_000_000 - 50_000 - 100_000 = 850_000
      });

      // 200_000 - 850_000 = -650_000 (surplus)
      expect(result.savingsGapCents).toBe(-650_000);
    });
  });

  // ── Emergency months ──────────────────────────────────────────────

  describe('emergency months', () => {
    it('should equal emergencyFund / totalFixed', () => {
      const result = calculateBaseline({
        ...base,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        emergencyFundCents: 1_000_000, // 1_000_000 / 180_000 = 5.56
      });

      expect(result.emergencyMonths).toBe(5.56);
    });

    it('should round to 2 decimal places', () => {
      // 1_000_000 / 300_000 = 3.3333... → 3.33
      const result = calculateBaseline({
        ...base,
        rentCents: 300_000,
        emergencyFundCents: 1_000_000,
      });

      expect(result.emergencyMonths).toBe(3.33);
    });

    it('should return 99 when totalFixed is 0 and fund is positive', () => {
      const result = calculateBaseline({
        ...base,
        emergencyFundCents: 500_000,
      });

      expect(result.emergencyMonths).toBe(99);
      expect(result.vulnerabilityBucket).toBe('high_buffer');
    });

    it('should return 0 when both totalFixed and fund are 0', () => {
      const result = calculateBaseline({ ...base });

      expect(result.emergencyMonths).toBe(0);
      expect(result.vulnerabilityBucket).toBe('overextended');
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle all-zero input', () => {
      const result = calculateBaseline({ ...base });

      expect(result.totalIncomeCents).toBe(0);
      expect(result.bufferReserveCents).toBe(0);
      expect(result.bufferSource).toBe('default_17.5pct');
      expect(result.totalFixedCents).toBe(0);
      expect(result.currentFreeCashCents).toBe(0);
      expect(result.emergencyMonths).toBe(0);
      expect(result.savingsGapCents).toBe(0);
      expect(result.vulnerabilityBucket).toBe('overextended');
    });

    it('should pass through emergencyFundCents and savingsTargetCents', () => {
      const result = calculateBaseline({
        ...base,
        emergencyFundCents: 1_234_567,
        savingsTargetCents: 7_654_321,
      });

      expect(result.emergencyFundCents).toBe(1_234_567);
      expect(result.savingsTargetCents).toBe(7_654_321);
    });

    it('should include expense items in fixed costs alongside rent/debt', () => {
      const result = calculateBaseline({
        ...base,
        rentCents: 100_000,
        debtPaymentsCents: 50_000,
        emergencyFundCents: 1_000_000,
        expenseItems: [monthlyFixed(50_000)],
      });

      expect(result.totalFixedCents).toBe(200_000);
      // 1_000_000 / 200_000 = 5.0
      expect(result.emergencyMonths).toBe(5);
    });

    it('should round default buffer to nearest cent', () => {
      // 333_333 * 0.175 = 58_333.275 → 58_333
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 333_333,
        bufferAmountCents: null,
      });

      expect(result.bufferReserveCents).toBe(58_333);
      expect(Number.isInteger(result.bufferReserveCents)).toBe(true);
    });

    it('default 17.5% buffer scales with added income items', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        incomeItems: [monthlyIncome(100_000)],
        bufferAmountCents: null,
      });

      // total income = 650_000, buffer = 650_000 * 0.175 = 113_750
      expect(result.totalIncomeCents).toBe(650_000);
      expect(result.bufferReserveCents).toBe(113_750);
    });
  });

  // ── Verification scenario walk-throughs ───────────────────────────

  describe('verification scenarios', () => {
    it('step 1+2: base profile with default buffer', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        emergencyFundCents: 1_000_000,
        savingsTargetCents: 600_000,
        bufferAmountCents: null,
      });

      expect(result.totalIncomeCents).toBe(550_000);
      expect(result.bufferReserveCents).toBe(96_250); // 550_000 * 0.175
      expect(result.bufferSource).toBe('default_17.5pct');
      expect(result.totalFixedCents).toBe(180_000);
      expect(result.currentFreeCashCents).toBe(273_750);
      expect(result.emergencyMonths).toBe(5.56); // 1_000_000 / 180_000
      expect(result.vulnerabilityBucket).toBe('tight_buffer');
    });

    it('step 3: custom buffer overrides default', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        emergencyFundCents: 1_000_000,
        bufferAmountCents: 50_000,
      });

      expect(result.bufferSource).toBe('user_defined');
      expect(result.bufferReserveCents).toBe(50_000);
      // freeCash = 550_000 - 50_000 - 180_000 = 320_000
      expect(result.currentFreeCashCents).toBe(320_000);
    });

    it('step 4: income item increases total income', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        incomeItems: [monthlyIncome(100_000)],
      });

      expect(result.totalIncomeCents).toBe(650_000);
    });

    it('step 5: annual income normalizes to monthly', () => {
      const result = calculateBaseline({
        ...base,
        primaryIncomeCents: 550_000,
        incomeItems: [annualIncome(1_200_000)], // 100_000/month
      });

      expect(result.totalIncomeCents).toBe(650_000);
    });

    it('step 6: expense item increases total fixed', () => {
      const result = calculateBaseline({
        ...base,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        expenseItems: [monthlyFixed(5_000)], // Gym $50
      });

      expect(result.totalFixedCents).toBe(185_000);
    });

    it('step 8: emergency months = fund / fixed', () => {
      const result = calculateBaseline({
        ...base,
        rentCents: 150_000,
        debtPaymentsCents: 30_000,
        emergencyFundCents: 1_000_000,
      });

      // 1_000_000 / 180_000 = 5.56
      expect(result.emergencyMonths).toBe(5.56);
      const str = result.emergencyMonths.toString();
      const decimals = str.includes('.') ? str.split('.')[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);
    });
  });
});
