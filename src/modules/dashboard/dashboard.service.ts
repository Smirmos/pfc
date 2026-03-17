import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import {
  analysisCases,
  analysisResults,
  userProfiles,
} from '../../database/schema';
import { ProfileService } from '../profile/profile.service';
import { BaselineSummary } from '../profile/baseline-calculator';

@Injectable()
export class DashboardService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly profileService: ProfileService,
  ) {}

  async getDashboard(userId: string) {
    // 1. Profile summary (null if no profile row exists)
    const profileRow = await this.drizzle.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    let profileSummary: BaselineSummary | null = null;
    if (profileRow[0]) {
      profileSummary = await this.profileService.getProfileSummary(userId);
    }

    // 2. Recent analyses (last 3) with latest result score
    const recentAnalyses = await this.getAnalysisSummaries(
      userId,
      3,
      undefined,
    );

    // 3. Active burdens (status = 'active')
    const activeBurdens = await this.getAnalysisSummaries(
      userId,
      undefined,
      'active',
    );

    // 4. Usage counts for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const analysesThisMonth = await this.drizzle.db
      .select({ count: sql<number>`count(*)::int` })
      .from(analysisCases)
      .where(
        and(
          eq(analysisCases.userId, userId),
          gte(analysisCases.createdAt, startOfMonth),
          sql`${analysisCases.status} != 'deleted'`,
        ),
      );

    return {
      profile_summary: profileSummary,
      recent_analyses: recentAnalyses,
      active_burdens: activeBurdens,
      recent_impulse_checks: [] as never[], // Phase 1 stub
      usage: {
        analyses_this_month: analysesThisMonth[0].count,
        impulse_checks_this_month: 0, // Phase 1 stub
      },
    };
  }

  private async getAnalysisSummaries(
    userId: string,
    limit?: number,
    statusFilter?: string,
  ) {
    const conditions = [
      eq(analysisCases.userId, userId),
      sql`${analysisCases.status} != 'deleted'`,
    ];

    if (statusFilter) {
      conditions.push(
        eq(
          analysisCases.status,
          statusFilter as 'active' | 'inactive' | 'deleted',
        ),
      );
    }

    const cases = await this.drizzle.db
      .select({
        id: analysisCases.id,
        name: analysisCases.name,
        category: analysisCases.category,
        status: analysisCases.status,
        createdAt: analysisCases.createdAt,
      })
      .from(analysisCases)
      .where(and(...conditions))
      .orderBy(desc(analysisCases.createdAt))
      .limit(limit ?? 100);

    // Fetch latest result for each case in one query
    const caseIds = cases.map((c) => c.id);
    if (caseIds.length === 0) return [];

    const results = await this.drizzle.db
      .select({
        caseId: analysisResults.caseId,
        score: analysisResults.score,
        vulnerabilityBucket: analysisResults.vulnerabilityBucket,
        monthlyBurdenCents: analysisResults.monthlyBurdenCents,
      })
      .from(analysisResults)
      .where(
        sql`${analysisResults.caseId} IN (${sql.join(
          caseIds.map((id) => sql`${id}`),
          sql`,`,
        )}) AND ${analysisResults.createdAt} = (
          SELECT MAX(r2.created_at) FROM analysis_results r2
          WHERE r2.case_id = ${analysisResults.caseId}
        )`,
      );

    const resultMap = new Map(
      results.map((r) => [
        r.caseId,
        {
          score: r.score,
          projected_vulnerability_bucket: r.vulnerabilityBucket,
          monthly_burden_cents: r.monthlyBurdenCents,
        },
      ]),
    );

    return cases.map((c) => {
      const result = resultMap.get(c.id);
      return {
        id: c.id,
        name: c.name,
        category: c.category,
        status: c.status,
        score: result?.score ?? null,
        projected_vulnerability_bucket:
          result?.projected_vulnerability_bucket ?? null,
        monthly_burden_cents: result?.monthly_burden_cents ?? null,
        created_at: c.createdAt,
      };
    });
  }
}
