import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { users } from '../../database/schema';

@Injectable()
export class UsersService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByEmail(email: string) {
    const result = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return result[0] ?? null;
  }

  async findById(id: string) {
    const result = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByGoogleId(googleId: string) {
    const result = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);
    return result[0] ?? null;
  }

  async findByPasswordResetToken(tokenHash: string) {
    const result = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, tokenHash))
      .limit(1);
    return result[0] ?? null;
  }

  async create(data: {
    email: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    googleId?: string;
    emailVerified?: boolean;
  }) {
    const result = await this.drizzle.db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        googleId: data.googleId,
        emailVerified: data.emailVerified ?? false,
      })
      .returning();
    return result[0];
  }

  async updateGoogleId(userId: string, googleId: string) {
    await this.drizzle.db
      .update(users)
      .set({ googleId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updatePasswordResetToken(
    userId: string,
    token: string | null,
    expires: Date | null,
  ) {
    await this.drizzle.db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.drizzle.db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
