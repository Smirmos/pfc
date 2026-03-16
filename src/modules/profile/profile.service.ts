import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import {
  expenseItems,
  incomeItems,
  userProfiles,
  users,
} from '../../database/schema';
import { calculateBaseline, Frequency } from './baseline-calculator';
import { CreateExpenseItemDto } from './dto/create-expense-item.dto';
import { CreateIncomeItemDto } from './dto/create-income-item.dto';
import { UpdateExpenseItemDto } from './dto/update-expense-item.dto';
import { UpdateIncomeItemDto } from './dto/update-income-item.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

@Injectable()
export class ProfileService {
  constructor(private readonly drizzle: DrizzleService) {}

  // ── User (GET/PATCH /me) ──────────────────────────────────────────

  async getMe(userId: string) {
    const row = await this.drizzle.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!row[0]) throw new NotFoundException('User not found');
    return row[0];
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.firstName !== undefined) updates.firstName = dto.firstName;
    if (dto.lastName !== undefined) updates.lastName = dto.lastName;

    await this.drizzle.db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId));

    return this.getMe(userId);
  }

  // ── Profile settings (GET/PUT/PATCH /me/profile) ──────────────────

  async getProfile(userId: string) {
    let profile = await this.findProfile(userId);
    if (!profile) {
      const result = await this.drizzle.db
        .insert(userProfiles)
        .values({ userId })
        .returning();
      profile = result[0];
    }

    const [income, expenses] = await Promise.all([
      this.listIncomeItems(userId),
      this.listExpenseItems(userId),
    ]);

    return {
      id: profile.id,
      currency: profile.currency,
      primaryIncomeCents: profile.primaryIncomeCents,
      partnerIncomeCents: profile.partnerIncomeCents,
      rentCents: profile.rentCents,
      debtPaymentsCents: profile.debtPaymentsCents,
      emergencyFundCents: profile.emergencyFundCents,
      savingsTargetCents: profile.savingsTargetCents,
      bufferAmountCents: profile.bufferAmountCents,
      incomeItems: income,
      expenseItems: expenses,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async upsertProfile(userId: string, dto: UpsertProfileDto) {
    const values = {
      currency: dto.currency,
      primaryIncomeCents: dollarsToCents(dto.primaryIncomeDollars),
      partnerIncomeCents: dollarsToCents(dto.partnerIncomeDollars ?? 0),
      rentCents: dollarsToCents(dto.rentDollars),
      debtPaymentsCents: dollarsToCents(dto.debtPaymentsDollars),
      emergencyFundCents: dollarsToCents(dto.emergencyFundDollars),
      savingsTargetCents: dollarsToCents(dto.savingsTargetDollars),
      bufferAmountCents:
        dto.bufferAmountDollars != null
          ? dollarsToCents(dto.bufferAmountDollars)
          : null,
    };

    const result = await this.drizzle.db
      .insert(userProfiles)
      .values({ userId, ...values })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: { ...values, updatedAt: new Date() },
      })
      .returning();

    return result[0];
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.findProfile(userId);

    if (!existing) {
      const result = await this.drizzle.db
        .insert(userProfiles)
        .values({
          userId,
          currency: dto.currency ?? 'USD',
          primaryIncomeCents: dollarsToCents(dto.primaryIncomeDollars ?? 0),
          partnerIncomeCents: dollarsToCents(dto.partnerIncomeDollars ?? 0),
          rentCents: dollarsToCents(dto.rentDollars ?? 0),
          debtPaymentsCents: dollarsToCents(dto.debtPaymentsDollars ?? 0),
          emergencyFundCents: dollarsToCents(dto.emergencyFundDollars ?? 0),
          savingsTargetCents: dollarsToCents(dto.savingsTargetDollars ?? 0),
          bufferAmountCents:
            dto.bufferAmountDollars !== undefined
              ? dto.bufferAmountDollars != null
                ? dollarsToCents(dto.bufferAmountDollars)
                : null
              : null,
        })
        .returning();
      return result[0];
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.currency !== undefined) updates.currency = dto.currency;
    if (dto.primaryIncomeDollars !== undefined)
      updates.primaryIncomeCents = dollarsToCents(dto.primaryIncomeDollars);
    if (dto.partnerIncomeDollars !== undefined)
      updates.partnerIncomeCents = dollarsToCents(dto.partnerIncomeDollars);
    if (dto.rentDollars !== undefined)
      updates.rentCents = dollarsToCents(dto.rentDollars);
    if (dto.debtPaymentsDollars !== undefined)
      updates.debtPaymentsCents = dollarsToCents(dto.debtPaymentsDollars);
    if (dto.emergencyFundDollars !== undefined)
      updates.emergencyFundCents = dollarsToCents(dto.emergencyFundDollars);
    if (dto.savingsTargetDollars !== undefined)
      updates.savingsTargetCents = dollarsToCents(dto.savingsTargetDollars);
    if (dto.bufferAmountDollars !== undefined)
      updates.bufferAmountCents =
        dto.bufferAmountDollars != null
          ? dollarsToCents(dto.bufferAmountDollars)
          : null;

    const result = await this.drizzle.db
      .update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.userId, userId))
      .returning();

    return result[0];
  }

  // ── Summary (GET /me/profile/summary) ─────────────────────────────

  async getProfileSummary(userId: string) {
    const profile = await this.findProfile(userId);
    const [income, expenses] = await Promise.all([
      this.listIncomeItems(userId),
      this.listExpenseItems(userId),
    ]);

    return calculateBaseline({
      primaryIncomeCents: profile?.primaryIncomeCents ?? 0,
      partnerIncomeCents: profile?.partnerIncomeCents ?? 0,
      rentCents: profile?.rentCents ?? 0,
      debtPaymentsCents: profile?.debtPaymentsCents ?? 0,
      emergencyFundCents: profile?.emergencyFundCents ?? 0,
      savingsTargetCents: profile?.savingsTargetCents ?? 0,
      bufferAmountCents: profile?.bufferAmountCents ?? null,
      incomeItems: income.map((i) => ({
        amountCents: i.amountCents,
        frequency: i.frequency as Frequency,
      })),
      expenseItems: expenses.map((e) => ({
        amountCents: e.amountCents,
        frequency: e.frequency as Frequency,
        isFixed: e.isFixed,
      })),
    });
  }

  // ── Income items CRUD ─────────────────────────────────────────────

  async listIncomeItems(userId: string) {
    return this.drizzle.db
      .select({
        id: incomeItems.id,
        label: incomeItems.label,
        amountCents: incomeItems.amountCents,
        frequency: incomeItems.frequency,
        createdAt: incomeItems.createdAt,
        updatedAt: incomeItems.updatedAt,
      })
      .from(incomeItems)
      .where(eq(incomeItems.userId, userId));
  }

  async createIncomeItem(userId: string, dto: CreateIncomeItemDto) {
    const result = await this.drizzle.db
      .insert(incomeItems)
      .values({
        userId,
        label: dto.label,
        amountCents: dollarsToCents(dto.amountDollars),
        frequency: dto.frequency,
      })
      .returning();
    return result[0];
  }

  async updateIncomeItem(
    userId: string,
    itemId: string,
    dto: UpdateIncomeItemDto,
  ) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.label !== undefined) updates.label = dto.label;
    if (dto.amountDollars !== undefined)
      updates.amountCents = dollarsToCents(dto.amountDollars);
    if (dto.frequency !== undefined) updates.frequency = dto.frequency;

    const result = await this.drizzle.db
      .update(incomeItems)
      .set(updates)
      .where(and(eq(incomeItems.id, itemId), eq(incomeItems.userId, userId)))
      .returning();

    if (!result[0]) throw new NotFoundException('Income item not found');
    return result[0];
  }

  async deleteIncomeItem(userId: string, itemId: string) {
    const result = await this.drizzle.db
      .delete(incomeItems)
      .where(and(eq(incomeItems.id, itemId), eq(incomeItems.userId, userId)))
      .returning({ id: incomeItems.id });

    if (!result[0]) throw new NotFoundException('Income item not found');
  }

  // ── Expense items CRUD ────────────────────────────────────────────

  async listExpenseItems(userId: string) {
    return this.drizzle.db
      .select({
        id: expenseItems.id,
        label: expenseItems.label,
        amountCents: expenseItems.amountCents,
        frequency: expenseItems.frequency,
        isFixed: expenseItems.isFixed,
        createdAt: expenseItems.createdAt,
        updatedAt: expenseItems.updatedAt,
      })
      .from(expenseItems)
      .where(eq(expenseItems.userId, userId));
  }

  async createExpenseItem(userId: string, dto: CreateExpenseItemDto) {
    const result = await this.drizzle.db
      .insert(expenseItems)
      .values({
        userId,
        label: dto.label,
        amountCents: dollarsToCents(dto.amountDollars),
        frequency: dto.frequency,
        isFixed: dto.isFixed ?? true,
      })
      .returning();
    return result[0];
  }

  async updateExpenseItem(
    userId: string,
    itemId: string,
    dto: UpdateExpenseItemDto,
  ) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.label !== undefined) updates.label = dto.label;
    if (dto.amountDollars !== undefined)
      updates.amountCents = dollarsToCents(dto.amountDollars);
    if (dto.frequency !== undefined) updates.frequency = dto.frequency;
    if (dto.isFixed !== undefined) updates.isFixed = dto.isFixed;

    const result = await this.drizzle.db
      .update(expenseItems)
      .set(updates)
      .where(and(eq(expenseItems.id, itemId), eq(expenseItems.userId, userId)))
      .returning();

    if (!result[0]) throw new NotFoundException('Expense item not found');
    return result[0];
  }

  async deleteExpenseItem(userId: string, itemId: string) {
    const result = await this.drizzle.db
      .delete(expenseItems)
      .where(and(eq(expenseItems.id, itemId), eq(expenseItems.userId, userId)))
      .returning({ id: expenseItems.id });

    if (!result[0]) throw new NotFoundException('Expense item not found');
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private async findProfile(userId: string) {
    const result = await this.drizzle.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return result[0] ?? null;
  }
}
