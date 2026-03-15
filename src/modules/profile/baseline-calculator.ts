export const FREQUENCIES = ['monthly', 'annual', 'weekly', 'biweekly'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export interface BaselineInput {
  primaryIncomeCents: number;
  rentCents: number;
  debtPaymentsCents: number;
  emergencyFundCents: number;
  savingsTargetCents: number;
  bufferAmountCents: number | null;
  incomeItems: { amountCents: number; frequency: Frequency }[];
  expenseItems: {
    amountCents: number;
    frequency: Frequency;
    isFixed: boolean;
  }[];
}

export interface BaselineSummary {
  totalIncomeCents: number;
  bufferReserveCents: number;
  bufferSource: 'default_17.5pct' | 'user_defined';
  totalFixedCents: number;
  currentFreeCashCents: number;
  emergencyFundCents: number;
  emergencyMonths: number;
  savingsTargetCents: number;
  savingsGapCents: number;
  vulnerabilityBucket:
    | 'overextended'
    | 'tight_buffer'
    | 'moderate_buffer'
    | 'high_buffer';
}

export function normalizeToMonthly(
  amountCents: number,
  frequency: Frequency,
): number {
  switch (frequency) {
    case 'monthly':
      return amountCents;
    case 'annual':
      return Math.round(amountCents / 12);
    case 'weekly':
      return Math.round((amountCents * 52) / 12);
    case 'biweekly':
      return Math.round((amountCents * 26) / 12);
  }
}

export function calculateBaseline(input: BaselineInput): BaselineSummary {
  const itemIncome = input.incomeItems.reduce(
    (sum, item) => sum + normalizeToMonthly(item.amountCents, item.frequency),
    0,
  );
  const totalIncomeCents = input.primaryIncomeCents + itemIncome;

  const bufferSource: BaselineSummary['bufferSource'] =
    input.bufferAmountCents != null ? 'user_defined' : 'default_17.5pct';
  const bufferReserveCents =
    input.bufferAmountCents ?? Math.round(totalIncomeCents * 0.175);

  const itemFixed = input.expenseItems
    .filter((item) => item.isFixed)
    .reduce(
      (sum, item) => sum + normalizeToMonthly(item.amountCents, item.frequency),
      0,
    );
  const totalFixedCents = input.rentCents + input.debtPaymentsCents + itemFixed;

  const currentFreeCashCents =
    totalIncomeCents - bufferReserveCents - totalFixedCents;

  let emergencyMonths: number;
  if (totalFixedCents === 0) {
    emergencyMonths = input.emergencyFundCents > 0 ? 99 : 0;
  } else {
    emergencyMonths =
      Math.round((input.emergencyFundCents / totalFixedCents) * 100) / 100;
  }

  const savingsGapCents = input.savingsTargetCents - currentFreeCashCents;

  let vulnerabilityBucket: BaselineSummary['vulnerabilityBucket'];
  if (emergencyMonths < 3) {
    vulnerabilityBucket = 'overextended';
  } else if (emergencyMonths < 6) {
    vulnerabilityBucket = 'tight_buffer';
  } else if (emergencyMonths < 9) {
    vulnerabilityBucket = 'moderate_buffer';
  } else {
    vulnerabilityBucket = 'high_buffer';
  }

  return {
    totalIncomeCents,
    bufferReserveCents,
    bufferSource,
    totalFixedCents,
    currentFreeCashCents,
    emergencyFundCents: input.emergencyFundCents,
    emergencyMonths,
    savingsTargetCents: input.savingsTargetCents,
    savingsGapCents,
    vulnerabilityBucket,
  };
}
