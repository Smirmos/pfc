import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, max, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DrizzleService } from '../../database/drizzle.service';
import { analysisCases, analysisInputs } from '../../database/schema';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';
import { SaveInputsDto } from './dto/save-inputs.dto';

@Injectable()
export class AnalysisService {
  constructor(private readonly drizzle: DrizzleService) {}

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
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(analysisCases.userId, userId),
      sql`${analysisCases.status} != 'deleted'`,
    ];

    if (filters.category) {
      conditions.push(
        eq(
          analysisCases.category,
          filters.category as 'vehicle' | 'home' | 'appliance' | 'other',
        ),
      );
    }
    if (filters.status) {
      conditions.push(
        eq(
          analysisCases.status,
          filters.status as 'active' | 'inactive' | 'deleted',
        ),
      );
    }

    const rows = await this.drizzle.db
      .select()
      .from(analysisCases)
      .where(and(...conditions))
      .orderBy(desc(analysisCases.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await this.drizzle.db
      .select({ count: sql<number>`count(*)::int` })
      .from(analysisCases)
      .where(and(...conditions));

    return {
      data: rows,
      meta: {
        page,
        limit,
        total: countResult[0].count,
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

  // ── Helpers ────────────────────────────────────────────────────────

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
