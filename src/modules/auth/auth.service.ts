import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { promisify } from 'util';
import { DrizzleService } from '../../database/drizzle.service';
import { auditEvents, refreshTokens } from '../../database/schema';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const scryptAsync = promisify(scrypt);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtPrivateKey: string;
  private readonly accessTokenTtl = 15 * 60; // 15 minutes
  private readonly refreshTokenTtl = 7 * 24 * 60 * 60; // 7 days

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly drizzle: DrizzleService,
    private readonly usersService: UsersService,
  ) {
    this.jwtPrivateKey = this.config
      .getOrThrow<string>('app.JWT_PRIVATE_KEY')
      .replace(/\\n/g, '\n');
  }

  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.logAudit(user.id, 'register', ip, userAgent);
    const tokens = await this.generateTokenPair(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.verifyPassword(dto.password, user.passwordHash);
    if (!valid) {
      await this.logAudit(user.id, 'login_failed', ip, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.logAudit(user.id, 'login', ip, userAgent);
    const tokens = await this.generateTokenPair(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(rawRefreshToken: string, ip?: string, userAgent?: string) {
    const tokenHash = this.sha256(rawRefreshToken);

    const rows = await this.drizzle.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    const storedToken = rows[0];

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse detection: revoked token presented again
    if (storedToken.revoked) {
      this.logger.warn(
        `Refresh token reuse detected for family ${storedToken.familyId}`,
      );
      await this.drizzle.db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.familyId, storedToken.familyId));

      await this.logAudit(
        storedToken.userId,
        'token_reuse_detected',
        ip,
        userAgent,
        { familyId: storedToken.familyId },
      );
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke current token
    await this.drizzle.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, storedToken.id));

    const user = await this.usersService.findById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.logAudit(user.id, 'token_refresh', ip, userAgent);
    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      storedToken.familyId,
    );
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async logout(userId: string, ip?: string, userAgent?: string) {
    await this.drizzle.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(
        and(eq(refreshTokens.userId, userId), eq(refreshTokens.revoked, false)),
      );

    await this.logAudit(userId, 'logout', ip, userAgent);
  }

  async forgotPassword(email: string, ip?: string, userAgent?: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // silent — prevents email enumeration

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.sha256(token);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.updatePasswordResetToken(
      user.id,
      tokenHash,
      expires,
    );
    await this.logAudit(user.id, 'forgot_password', ip, userAgent);

    // TODO: send email with reset link containing `token`
    this.logger.log(`Password reset token generated for ${email}`);
  }

  async resetPassword(
    token: string,
    newPassword: string,
    ip?: string,
    userAgent?: string,
  ) {
    const tokenHash = this.sha256(token);
    const user = await this.usersService.findByPasswordResetToken(tokenHash);

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.usersService.updatePassword(user.id, passwordHash);

    // Revoke all refresh tokens for security
    await this.drizzle.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, user.id));

    await this.logAudit(user.id, 'reset_password', ip, userAgent);
  }

  async generateTokenPair(userId: string, email: string, familyId?: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      privateKey: this.jwtPrivateKey,
      algorithm: 'RS256',
      expiresIn: this.accessTokenTtl,
    });

    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHash = this.sha256(rawRefreshToken);
    const family = familyId ?? crypto.randomUUID();

    await this.drizzle.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      familyId: family,
      expiresAt: new Date(Date.now() + this.refreshTokenTtl * 1000),
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async handleGoogleUser(user: { id: string; email: string }) {
    return this.generateTokenPair(user.id, user.email);
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    emailVerified: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    const [salt, key] = hash.split(':');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const keyBuffer = Buffer.from(key, 'hex');
    return timingSafeEqual(derivedKey, keyBuffer);
  }

  private sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private async logAudit(
    userId: string | null,
    action: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.drizzle.db.insert(auditEvents).values({
      userId,
      action,
      ipAddress: ip,
      userAgent,
      metadata,
    });
  }
}
