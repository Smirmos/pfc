import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, max, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DrizzleService } from '../../database/drizzle.service';
import {
  analysisCases,
  analysisInputs,
  analysisResults,
  scenarioResults,
} from '../../database/schema';
import { ProfileService } from '../profile/profile.service';
import {
  calculateAffordability,
  ProfileSnapshot,
  AnalysisInputPayload,
} from './engine/engine';
import { generateWarnings } from './engine/warnings';
import { generateScenarios, ScenarioInput } from './engine/scenarios';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';
import { SaveInputsDto } from './dto/save-inputs.dto';

const DISCLAIMER =
  'This analysis is for informational purposes only and does not constitute financial advice.';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly profileService: ProfileService,
  ) {}

  // ── Case CRUD ──────────────────────────────────────────────────────

  async create(userId: string, dto: CreateAnalysisDto) {
    const result = await this.drizzle.db
      .insert(analysisCases)
      .values({
        userId,
        name: dto.name,
        category: dto.category as 'vehicle' | 'home' | 'appliance' | 'other',
      })
      .returning();
    return result[0];
  }

  async findAll(
    userId: string,
    filters: {
      category?: string;
      status?: string;
      page?: number;
      limit?: number;
      sort?: string;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const whereFragments = [
      sql`ac.user_id = ${userId}`,
      sql`ac.status != 'deleted'`,
    ];
    if (filters.category) {
      whereFragments.push(sql`ac.category = ${filters.category}`);
    }
    if (filters.status) {
      whereFragments.push(sql`ac.status = ${filters.status}`);
    }
    const whereClause = sql.join(whereFragments, sql` AND `);

    const orderClause = this.buildSortClause(filters.sort);

    const rows = await this.drizzle.db.execute(sql`
      SELECT
        ac.id,
        ac.name,
        ac.category,
        ac.status,
        ac.created_at,
        lr.score,
        lr.vulnerability_bucket AS projected_vulnerability_bucket,
        lr.monthly_burden_cents
      FROM analysis_cases ac
      LEFT JOIN LATERAL (
        SELECT ar.score, ar.vulnerability_bucket, ar.monthly_burden_cents
        FROM analysis_results ar
        WHERE ar.case_id = ac.id
        ORDER BY ar.created_at DESC
        LIMIT 1
      ) lr ON true
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const statsRows = await this.drizzle.db.execute(sql`
      SELECT
        count(*)::int                                                                     AS total,
        MAX(lr.score)::int                                                                AS highest_score,
        ROUND(AVG(lr.score))::int                                                         AS average_score,
        COUNT(*) FILTER (WHERE ac.status = 'active' AND lr.monthly_burden_cents > 0)::int AS active_burdens_count
      FROM analysis_cases ac
      LEFT JOIN LATERAL (
        SELECT ar.score, ar.monthly_burden_cents
        FROM analysis_results ar
        WHERE ar.case_id = ac.id
        ORDER BY ar.created_at DESC
        LIMIT 1
      ) lr ON true
      WHERE ${whereClause}
    `);

    const s = statsRows.rows[0] as {
      total: number;
      highest_score: number | null;
      average_score: number | null;
      active_burdens_count: number;
    };

    return {
      data: (rows.rows as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        category: r.category as string,
        status: r.status as string,
        score: (r.score as number) ?? null,
        projected_vulnerability_bucket:
          (r.projected_vulnerability_bucket as string) ?? null,
        monthly_burden_cents: (r.monthly_burden_cents as number) ?? null,
        created_at: r.created_at as string,
      })),
      meta: {
        page,
        limit,
        total: s.total,
      },
      stats: {
        highest_score: s.highest_score,
        average_score: s.average_score,
        active_burdens_count: s.active_burdens_count ?? 0,
      },
    };
  }

  async findOne(userId: string, caseId: string) {
    const rows = await this.drizzle.db
      .select({
        id: analysisCases.id,
        userId: analysisCases.userId,
        name: analysisCases.name,
        category: analysisCases.category,
        status: analysisCases.status,
        createdAt: analysisCases.createdAt,
        updatedAt: analysisCases.updatedAt,
        latestInputVersion: analysisInputs.inputVersion,
        latestPayload: analysisInputs.payloadJson,
        inputCreatedAt: analysisInputs.createdAt,
      })
      .from(analysisCases)
      .leftJoin(
        analysisInputs,
        and(
          eq(analysisInputs.caseId, analysisCases.id),
          eq(
            analysisInputs.inputVersion,
            this.drizzle.db
              .select({ mv: max(analysisInputs.inputVersion) })
              .from(analysisInputs)
              .where(eq(analysisInputs.caseId, analysisCases.id)),
          ),
        ),
      )
      .where(
        and(
          eq(analysisCases.id, caseId),
          eq(analysisCases.userId, userId),
          sql`${analysisCases.status} != 'deleted'`,
        ),
      )
      .limit(1);

    if (!rows[0]) throw new NotFoundException('Analysis case not found');

    const row = rows[0];
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      category: row.category,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      latestInputs: row.latestInputVersion
        ? {
            inputVersion: row.latestInputVersion,
            payload: row.latestPayload,
            createdAt: row.inputCreatedAt,
          }
        : null,
    };
  }

  async update(userId: string, caseId: string, dto: UpdateAnalysisDto) {
    const result = await this.drizzle.db
      .update(analysisCases)
      .set({ name: dto.name, updatedAt: new Date() })
      .where(
        and(
          eq(analysisCases.id, caseId),
          eq(analysisCases.userId, userId),
          sql`${analysisCases.status} != 'deleted'`,
        ),
      )
      .returning();

    if (!result[0]) throw new NotFoundException('Analysis case not found');
    return result[0];
  }

  async softDelete(userId: string, caseId: string) {
    const result = await this.drizzle.db
      .update(analysisCases)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(
        and(
          eq(analysisCases.id, caseId),
          eq(analysisCases.userId, userId),
          sql`${analysisCases.status} != 'deleted'`,
        ),
      )
      .returning({ id: analysisCases.id });

    if (!result[0]) throw new NotFoundException('Analysis case not found');
  }

  async bulkDelete(userId: string, ids: string[]) {
    const result = await this.drizzle.db
      .update(analysisCases)
      .set({ status: 'deleted' as const, updatedAt: new Date() })
      .where(
        and(
          eq(analysisCases.userId, userId),
          sql`${analysisCases.id} IN (${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          sql`${analysisCases.status} != 'deleted'`,
        ),
      )
      .returning({ id: analysisCases.id });

    return { deleted: result.length };
  }

  async duplicate(userId: string, caseId: string) {
    const original = await this.findOne(userId, caseId);

    const newCase = await this.drizzle.db
      .insert(analysisCases)
      .values({
        userId,
        name: `${original.name} (copy)`,
        category: original.category,
      })
      .returning();

    if (original.latestInputs) {
      await this.drizzle.db.insert(analysisInputs).values({
        caseId: newCase[0].id,
        inputVersion: 1,
        payloadJson: original.latestInputs.payload,
      });
    }

    return newCase[0];
  }

  // ── Inputs (INSERT-ONLY, versioned) ────────────────────────────────

  async saveInputs(userId: string, caseId: string, payload: SaveInputsDto) {
    await this.assertOwnership(userId, caseId);

    // Transaction-safe versioned insert using advisory lock to prevent races
    const result = await this.drizzle.db.transaction(async (tx) => {
      // Advisory lock scoped to this transaction, keyed on case_id
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${caseId}))`);

      const versionRow = await tx.execute(
        sql`SELECT COALESCE(MAX(${analysisInputs.inputVersion}), 0) + 1 AS next_version
            FROM ${analysisInputs}
            WHERE ${analysisInputs.caseId} = ${caseId}`,
      );

      const nextVersion = (versionRow.rows[0] as { next_version: number })
        .next_version;

      const inserted = await tx
        .insert(analysisInputs)
        .values({
          caseId,
          inputVersion: nextVersion,
          payloadJson: payload,
        })
        .returning();

      return inserted[0];
    });

    return result;
  }

  async getLatestInputs(userId: string, caseId: string) {
    await this.assertOwnership(userId, caseId);

    const rows = await this.drizzle.db
      .select()
      .from(analysisInputs)
      .where(
        and(
          eq(analysisInputs.caseId, caseId),
          eq(
            analysisInputs.inputVersion,
            this.drizzle.db
              .select({ mv: max(analysisInputs.inputVersion) })
              .from(analysisInputs)
              .where(eq(analysisInputs.caseId, caseId)),
          ),
        ),
      )
      .limit(1);

    if (!rows[0]) return null;
    return rows[0];
  }

  // ── File stubs ─────────────────────────────────────────────────────

  async getUploadUrl(userId: string, caseId: string) {
    await this.assertOwnership(userId, caseId);
    return {
      uploadUrl: 'https://stub-s3-url',
      fileId: randomUUID(),
    };
  }

  async queueExtraction(userId: string, caseId: string) {
    await this.assertOwnership(userId, caseId);
    return {
      status: 'queued' as const,
      jobId: randomUUID(),
    };
  }

  // ── Status transitions ────────────────────────────────────────────

  async activate(userId: string, caseId: string) {
    const result = await this.drizzle.db
      .update(analysisCases)
      .set({ status: 'active', updatedAt: new Date() })
      .where(
        and(
          eq(analysisCases.id, caseId),
          eq(analysisCases.userId, userId),
          sql`${analysisCases.status} != 'deleted'`,
        ),
      )
      .returning();

    if (!result[0]) throw new NotFoundException('Analysis case not found');
    return result[0];
  }

  async deactivate(userId: string, caseId: string) {
    const result = await this.drizzle.db
      .update(analysisCases)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(
        and(
          eq(analysisCases.id, caseId),
          eq(analysisCases.userId, userId),
          sql`${analysisCases.status} != 'deleted'`,
        ),
      )
      .returning();

    if (!result[0]) throw new NotFoundException('Analysis case not found');
    return result[0];
  }

  // ── Engine (run / results) ────────────────────────────────────────

  async run(userId: string, caseId: string) {
    await this.assertOwnership(userId, caseId);

    // 1. Fetch profile summary -> BaselineResult
    const baseline = await this.profileService.getProfileSummary(userId);

    const profile: ProfileSnapshot = {
      total_income: baseline.totalIncomeCents,
      buffer_reserve: baseline.bufferReserveCents,
      buffer_source: baseline.bufferSource,
      total_fixed: baseline.totalFixedCents,
      non_buffer_fixed: baseline.totalFixedCents,
      current_free_cash: baseline.currentFreeCashCents,
      emergency_months: baseline.emergencyMonths,
      vulnerability_bucket: baseline.vulnerabilityBucket,
      savings_gap: baseline.savingsGapCents,
      savings_gap_status:
        baseline.savingsGapCents > 0
          ? 'shortfall'
          : baseline.savingsGapCents < 0
            ? 'surplus'
            : 'on_target',
    };

    // 2. Fetch latest analysis inputs
    const latestInput = await this.getLatestInputs(userId, caseId);
    if (!latestInput) {
      throw new NotFoundException(
        'No inputs found for this analysis case. Save inputs first.',
      );
    }

    const payload = latestInput.payloadJson as Record<string, unknown>;
    const inputs: AnalysisInputPayload = {
      monthly_payment_cents: payload.monthly_payment_cents as
        | number
        | undefined,
      insurance_monthly_cents: payload.insurance_monthly_cents as
        | number
        | undefined,
      maintenance_monthly_cents: payload.maintenance_monthly_cents as
        | number
        | undefined,
      extra_monthly_costs_cents: payload.extra_monthly_costs_cents as
        | number
        | undefined,
      cash_price_cents: payload.cash_price_cents as number | undefined,
      fees_cents: payload.fees_cents as number | undefined,
      term_months: payload.term_months as number | undefined,
      duration_months: payload.duration_months as number | undefined,
      balloon_payment_cents: payload.balloon_payment_cents as
        | number
        | undefined,
      is_variable_rate: payload.is_variable_rate as boolean | undefined,
    };

    // 3. Run affordability calculation
    const result = calculateAffordability(profile, inputs);

    // 4. Generate warnings
    const warnings = generateWarnings(result, inputs);

    // 5. Insert into analysis_results
    const inserted = await this.drizzle.db
      .insert(analysisResults)
      .values({
        caseId,
        inputVersion: latestInput.inputVersion,
        score: result.score,
        projectedFreeCashCents: result.projected_free_cash,
        monthlyBurdenCents: result.new_monthly_burden,
        totalLongTermCostCents: result.total_long_term_cost,
        opportunityCostCents: Math.round(result.opportunity_cost),
        vulnerabilityBucket: result.projected_vulnerability_bucket,
        warningsJson: JSON.stringify(warnings),
        assumptionsJson: JSON.stringify({
          buffer_source: profile.buffer_source,
          emergency_fund_level: result.emergency_fund_level,
          calculation_version: '1.0.0',
          pre_purchase_free_cash: profile.current_free_cash,
          pre_purchase_vulnerability: profile.vulnerability_bucket,
        }),
        calculationVersion: '1.0.0',
      })
      .returning();

    // 6. Generate scenarios and bulk-insert
    const scenarioInput: ScenarioInput = {
      ...inputs,
      down_payment_cents: payload.down_payment_cents as number | undefined,
      interest_rate_pct: payload.interest_rate_pct as number | undefined,
      loan_amount_cents: payload.loan_amount_cents as number | undefined,
    };

    const scenarios = generateScenarios(scenarioInput, profile);

    await this.drizzle.db.insert(scenarioResults).values(
      scenarios.map((s) => ({
        resultId: inserted[0].id,
        label: s.label,
        scenarioType: s.scenario_type,
        score: s.score,
        freeCashCents: s.projected_free_cash,
        monthlyBurdenCents: s.monthly_burden,
        totalCostCents: s.total_long_term_cost,
      })),
    );

    // 7. Return full result + disclaimer
    return {
      ...inserted[0],
      warningsJson: warnings,
      assumptionsJson: {
        buffer_source: profile.buffer_source,
        emergency_fund_level: result.emergency_fund_level,
        calculation_version: '1.0.0',
        pre_purchase_free_cash: profile.current_free_cash,
        pre_purchase_vulnerability: profile.vulnerability_bucket,
      },
      scenarios,
      disclaimer: DISCLAIMER,
    };
  }

  async getLatestResult(userId: string, caseId: string) {
    await this.assertOwnership(userId, caseId);

    const rows = await this.drizzle.db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.caseId, caseId))
      .orderBy(desc(analysisResults.createdAt))
      .limit(1);

    if (!rows[0]) throw new NotFoundException('No results found');

    const row = rows[0];
    return {
      ...row,
      warningsJson:
        typeof row.warningsJson === 'string'
          ? JSON.parse(row.warningsJson)
          : row.warningsJson,
      assumptionsJson:
        typeof row.assumptionsJson === 'string'
          ? JSON.parse(row.assumptionsJson)
          : row.assumptionsJson,
      disclaimer: DISCLAIMER,
    };
  }

  // ── Scenarios ─────────────────────────────────────────────────────

  async getScenarios(userId: string, caseId: string) {
    await this.assertOwnership(userId, caseId);

    // Find the latest result for this case
    const latestResult = await this.drizzle.db
      .select({ id: analysisResults.id })
      .from(analysisResults)
      .where(eq(analysisResults.caseId, caseId))
      .orderBy(desc(analysisResults.createdAt))
      .limit(1);

    if (!latestResult[0]) return [];

    const rows = await this.drizzle.db
      .select()
      .from(scenarioResults)
      .where(eq(scenarioResults.resultId, latestResult[0].id));

    if (rows.length === 0) return [];

    // Find the BASE scenario for delta computation
    const baseRow = rows.find((r) => r.scenarioType === 'BASE');
    if (!baseRow) return rows;

    return rows.map((r) => ({
      ...r,
      delta_vs_base: {
        score: r.score - baseRow.score,
        monthly_burden: r.monthlyBurdenCents - baseRow.monthlyBurdenCents,
        projected_free_cash: r.freeCashCents - baseRow.freeCashCents,
        total_long_term_cost: r.totalCostCents - baseRow.totalCostCents,
      },
    }));
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private buildSortClause(sort?: string) {
    switch (sort) {
      case 'created_at:asc':
        return sql`ac.created_at ASC`;
      case 'score:desc':
        return sql`lr.score DESC NULLS LAST`;
      case 'score:asc':
        return sql`lr.score ASC NULLS LAST`;
      case 'name:asc':
        return sql`LOWER(ac.name) ASC`;
      case 'name:desc':
        return sql`LOWER(ac.name) DESC`;
      case 'created_at:desc':
      default:
        return sql`ac.created_at DESC`;
    }
  }

  private async assertOwnership(userId: string, caseId: string) {
    const row = await this.drizzle.db
      .select({ id: analysisCases.id })
      .from(analysisCases)
      .where(
        and(
          eq(analysisCases.id, caseId),
          eq(analysisCases.userId, userId),
          sql`${analysisCases.status} != 'deleted'`,
        ),
      )
      .limit(1);

    if (!row[0]) throw new NotFoundException('Analysis case not found');
  }
}
