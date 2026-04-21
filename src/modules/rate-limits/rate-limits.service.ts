import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class RateLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async check(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSeconds * 1000);

    const record = await this.prisma.rateLimit.findUnique({ where: { key } });

    if (!record) {
      await this.prisma.rateLimit.create({
        data: {
          key,
          hits: 1,
          windowStart: now,
          windowDurationSeconds: windowSeconds,
        },
      });
      return { allowed: true, remaining: limit - 1 };
    }

    // Reset if window expired
    if (record.windowStart < windowStart) {
      await this.prisma.rateLimit.update({
        where: { key },
        data: { hits: 1, windowStart: now },
      });
      return { allowed: true, remaining: limit - 1 };
    }

    // Check limit
    if (record.hits >= limit) {
      return { allowed: false, remaining: 0 };
    }

    // Increment
    await this.prisma.rateLimit.update({
      where: { key },
      data: { hits: { increment: 1 } },
    });

    return { allowed: true, remaining: limit - record.hits - 1 };
  }

  async reset(key: string) {
    await this.prisma.rateLimit.delete({ where: { key } }).catch(() => {});
    return { message: 'Rate limit reset' };
  }
}
