import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, refreshToken: string, ipAddress?: string, userAgent?: string) {
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
      if (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt < new Date()) {
        continue;
      }

      if (session.refreshTokenHash) {
        const isValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
        if (isValid) {
          return session;
        }
      }
    }

    return null;
  }

  async invalidate(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isActive: false },
    });

    return { message: 'Session invalidated' };
  }

  async invalidateAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return { message: 'All sessions invalidated' };
  }

  async getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceType: true,
        lastActiveAt: true,
        createdAt: true,
        refreshTokenExpiresAt: true,
      },
    });
  }
}
