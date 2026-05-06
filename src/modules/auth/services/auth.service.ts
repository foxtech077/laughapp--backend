import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SignupService } from '../../signup/signup.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly signupService: SignupService,
  ) { }

  // ============================================================
  // OTP Management
  // ============================================================

  /**
   * Generate and store OTP for a phone number.
   * DEV MODE: OTP = last 6 digits of the phone number.
   */
  async generateOtp(phoneNumber: string): Promise<string> {
    // DEV ONLY: OTP is last 6 digits of phone number
    const otp = phoneNumber.slice(-6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otp.upsert({
      where: { phoneNumber },
      update: { otp, expiresAt, verifiedAt: null, createdAt: new Date() },
      create: { phoneNumber, otp, expiresAt },
    });

    console.log(`📱 [DEV] OTP for ${phoneNumber}: ${otp}`);

    return otp;
  }

  /**
   * Find a valid (non-expired, non-verified) OTP for a phone number.
   */
  async findValidOtp(phoneNumber: string) {
    const otp = await this.prisma.otp.findUnique({
      where: { phoneNumber },
    });

    if (!otp) return null;
    if (otp.verifiedAt) return null;
    if (otp.expiresAt < new Date()) return null;

    return otp;
  }

  /**
   * Mark OTP as verified (cleanup after successful auth).
   */
  async markOtpVerified(phoneNumber: string) {
    await this.prisma.otp.update({
      where: { phoneNumber },
      data: { verifiedAt: new Date() },
    });
  }

  /**
   * Invalidate (delete) OTP after successful verification.
   */
  async deleteOtp(phoneNumber: string) {
    await this.prisma.otp.deleteMany({ where: { phoneNumber } });
  }

  // ============================================================
  // Token Generation
  // ============================================================

  generateTokens(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = uuidv4();
    return { accessToken, refreshToken };
  }

  private generateAccessToken(userId: string): string {
    // Simple token for MVP — replace with proper JWT in production
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
  }

  // ============================================================
  // User Management
  // ============================================================

  /**
   * Find existing user by phone number.
   */
  async findUserByPhone(phoneNumber: string) {
    return this.prisma.user.findFirst({
      where: { phoneNumber, deletedAt: null },
    });
  }

  /**
   * Create a new FAN user from phone-based signup.
   */
  async createPhoneUser(phoneNumber: string) {
    const profileLink = `user-${uuidv4().slice(0, 8)}`;

    return this.prisma.user.create({
      data: {
        userType: 'ANONYMOUS',
        email: null,
        phoneNumber,
        profileLink,
        isOnTrial: false,
        trialStartedAt: null,
        trialEndsAt: null,
        coinBalance: 0,
      },
    });
  }

  // ============================================================
  // Session Management
  // ============================================================

  async createSession(userId: string, refreshToken: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: tokenHash,
        refreshTokenExpiresAt: expiresAt,
        ipAddress,
        userAgent,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
    });

    for (const session of sessions) {
      if (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt < new Date()) continue;
      if (session.refreshTokenHash) {
        const isValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
        if (isValid) return session;
      }
    }
    return null;
  }

  // ============================================================
  // Core Auth Flow
  // ============================================================

  async handleSignupFlow(user: { id: string }, source?: { creatorId?: string, videoId?: string, inviteId?: string }) {
    console.log(`📱 [DEV] Handling signup flow for user ${user.id}`);
    await this.signupService.handleSignupFlow(user, source);
  }

  /**
   * Build safe user response (excludes sensitive fields).
   */
  buildUserResponse(user: Record<string, unknown>) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}