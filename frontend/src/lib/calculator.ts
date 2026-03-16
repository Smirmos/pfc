export type Frequency = 'monthly' | 'annual' | 'weekly' | 'biweekly';

export const FREQUENCIES: readonly Frequency[] = [
  'monthly',
  'annual',
  'weekly',
  'biweekly',
];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  monthly: 'Monthly',
  annual: 'Annually',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
};

export interface BaselineInput {
  primaryIncome: number;
  partnerIncome: number;
  rent: number;
  debtPayments: number;
  emergencyFund: number;
  savingsTarget: number;
  bufferAmount: number | null;
  incomeItems: { amount: number; frequency: Frequency }[];
  expenseItems: { amount: number; frequency: Frequency; isFixed: boolean }[];
}

export interface BaselineSummary {
  totalIncome: number;
  bufferReserve: number;
  bufferSource: 'default_17.5pct' | 'user_defined';
  totalFixed: number;
  currentFreeCash: number;
  emergencyFund: number;
  emergencyMonths: number;
  savingsTarget: number;
  savingsGap: number;
  vulnerabilityBucket:
    | 'overextended'
    | 'tight_buffer'
    | 'moderate_buffer'
    | 'high_buffer';
}

export function normalizeToMonthly(
  amount: number,
  frequency: Frequency,
): number {
  switch (frequency) {
    case 'monthly':
      return amount;
    case 'annual':
      return Math.round((amount / 12) * 100) / 100;
    case 'weekly':
      return Math.round(((amount * 52) / 12) * 100) / 100;
    case 'biweekly':
      return Math.round(((amount * 26) / 12) * 100) / 100;
  }
}

export function calculateBaseline(input: BaselineInput): BaselineSummary {
  const itemIncome = input.incomeItems.reduce(
    (sum, item) => sum + normalizeToMonthly(item.amount, item.frequency),
    0,
  );
  const totalIncome = input.primaryIncome + input.partnerIncome + itemIncome;

  const bufferSource: BaselineSummary['bufferSource'] =
    input.bufferAmount != null ? 'user_defined' : 'default_17.5pct';
  const bufferReserve =
    input.bufferAmount ?? Math.round(totalIncome * 0.175 * 100) / 100;

  const itemFixed = input.expenseItems
    .filter((item) => item.isFixed)
    .reduce(
      (sum, item) => sum + normalizeToMonthly(item.amount, item.frequency),
      0,
    );
  const totalFixed = input.rent + input.debtPayments + itemFixed;

  const currentFreeCash = totalIncome - bufferReserve - totalFixed;

  let emergencyMonths: number;
  if (totalFixed === 0) {
    emergencyMonths = input.emergencyFund > 0 ? 99 : 0;
  } else {
    emergencyMonths =
      Math.round((input.emergencyFund / totalFixed) * 100) / 100;
  }

  const savingsGap = input.savingsTarget - currentFreeCash;

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
    totalIncome,
    bufferReserve,
    bufferSource,
    totalFixed,
    currentFreeCash,
    emergencyFund: input.emergencyFund,
    emergencyMonths,
    savingsTarget: input.savingsTarget,
    savingsGap,
    vulnerabilityBucket,
  };
}
