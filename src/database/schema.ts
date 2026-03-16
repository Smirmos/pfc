/**
 * Drizzle schema definitions for Private Finance Advisor.
 *
 * IMPORTANT: All monetary values MUST be stored as integers representing cents.
 * For example, $19.99 is stored as 1999.
 * Never use floating-point types (real, doublePrecision) for money.
 * Use `integer` or `bigint` columns for all monetary amounts.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  googleId: varchar('google_id', { length: 255 }).unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  passwordResetToken: varchar('password_reset_token', { length: 64 }),
  passwordResetExpires: timestamp('password_reset_expires', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    familyId: uuid('family_id').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revoked: boolean('revoked').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_refresh_tokens_user_id').on(table.userId),
    index('idx_refresh_tokens_family_id').on(table.familyId),
    index('idx_refresh_tokens_token_hash').on(table.tokenHash),
  ],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: varchar('action', { length: 50 }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_audit_events_user_id').on(table.userId),
    index('idx_audit_events_action').on(table.action),
  ],
);

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  primaryIncomeCents: integer('primary_income_cents').default(0).notNull(),
  partnerIncomeCents: integer('partner_income_cents').default(0).notNull(),
  rentCents: integer('rent_cents').default(0).notNull(),
  debtPaymentsCents: integer('debt_payments_cents').default(0).notNull(),
  emergencyFundCents: integer('emergency_fund_cents').default(0).notNull(),
  savingsTargetCents: integer('savings_target_cents').default(0).notNull(),
  bufferAmountCents: integer('buffer_amount_cents'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const incomeItems = pgTable(
  'income_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 100 }).notNull(),
    amountCents: integer('amount_cents').notNull(),
    frequency: varchar('frequency', { length: 20 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_income_items_user_id').on(table.userId)],
);

export const expenseItems = pgTable(
  'expense_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 100 }).notNull(),
    amountCents: integer('amount_cents').notNull(),
    frequency: varchar('frequency', { length: 20 }).notNull(),
    isFixed: boolean('is_fixed').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_expense_items_user_id').on(table.userId)],
);

// ── Analysis module ──────────────────────────────────────────────────

export const analysisCategoryEnum = pgEnum('analysis_category', [
  'vehicle',
  'home',
  'appliance',
  'other',
]);

export const analysisCaseStatusEnum = pgEnum('analysis_case_status', [
  'active',
  'inactive',
  'deleted',
]);

export const uploadedFileStatusEnum = pgEnum('uploaded_file_status', [
  'pending',
  'extracted',
  'failed',
]);

export const analysisCases = pgTable(
  'analysis_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    category: analysisCategoryEnum('category').notNull(),
    status: analysisCaseStatusEnum('status').default('inactive').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_analysis_cases_user_id').on(table.userId),
    index('idx_analysis_cases_status').on(table.status),
  ],
);

export const analysisInputs = pgTable(
  'analysis_inputs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => analysisCases.id, { onDelete: 'cascade' }),
    inputVersion: integer('input_version').notNull(),
    payloadJson: jsonb('payload_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_analysis_inputs_case_id').on(table.caseId),
    index('idx_analysis_inputs_case_version').on(
      table.caseId,
      table.inputVersion,
    ),
  ],
);

export const analysisResults = pgTable(
  'analysis_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => analysisCases.id, { onDelete: 'cascade' }),
    inputVersion: integer('input_version').notNull(),
    score: integer('score').notNull(),
    projectedFreeCashCents: integer('projected_free_cash_cents').notNull(),
    monthlyBurdenCents: integer('monthly_burden_cents').notNull(),
    totalLongTermCostCents: integer('total_long_term_cost_cents').notNull(),
    opportunityCostCents: integer('opportunity_cost_cents').notNull(),
    vulnerabilityBucket: varchar('vulnerability_bucket', {
      length: 50,
    }).notNull(),
    warningsJson: jsonb('warnings_json'),
    assumptionsJson: jsonb('assumptions_json'),
    calculationVersion: varchar('calculation_version', {
      length: 20,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_analysis_results_case_id').on(table.caseId)],
);

export const scenarioResults = pgTable(
  'scenario_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resultId: uuid('result_id')
      .notNull()
      .references(() => analysisResults.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 255 }).notNull(),
    scenarioType: varchar('scenario_type', { length: 50 }).notNull(),
    score: integer('score').notNull(),
    freeCashCents: integer('free_cash_cents').notNull(),
    monthlyBurdenCents: integer('monthly_burden_cents').notNull(),
    totalCostCents: integer('total_cost_cents').notNull(),
  },
  (table) => [index('idx_scenario_results_result_id').on(table.resultId)],
);

export const uploadedFiles = pgTable(
  'uploaded_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => analysisCases.id, { onDelete: 'cascade' }),
    s3Key: varchar('s3_key', { length: 1024 }).notNull(),
    originalFilename: varchar('original_filename', { length: 255 }).notNull(),
    status: uploadedFileStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_uploaded_files_case_id').on(table.caseId)],
);
