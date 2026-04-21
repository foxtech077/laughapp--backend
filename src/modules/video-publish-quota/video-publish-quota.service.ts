import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class VideoPublishQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuota(creatorId: string) {
    let quota = await this.prisma.videoPublishQuota.findUnique({
      where: { creatorId },
    });

    if (!quota) {
      quota = await this.prisma.videoPublishQuota.create({
        data: {
          creatorId,
          dailyResetAt: new Date(),
          weeklyResetAt: new Date(),
        },
      });
    }

    // Check if resets are needed
    const now = new Date();
    let needsReset = false;

    if (quota.dailyResetAt && now > quota.dailyResetAt) {
      needsReset = true;
    }

    if (quota.weeklyResetAt && now > quota.weeklyResetAt) {
      needsReset = true;
    }

    if (needsReset) {
      quota = await this.prisma.videoPublishQuota.update({
        where: { creatorId },
        data: {
          publishedThisDay: 0,
          publishedThisWeek: 0,
          dailyResetAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          weeklyResetAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return {
      publishedThisDay: quota.publishedThisDay,
      publishedThisWeek: quota.publishedThisWeek,
      dailyLimit: 1,
      weeklyLimit: 3,
      canPublishToday: quota.publishedThisDay < 1 && !quota.isBlocked,
      canPublishWeek: quota.publishedThisWeek < 3 && !quota.isBlocked,
      isBlocked: quota.isBlocked,
      blockedUntil: quota.blockedUntil,
      blockReason: quota.blockReason,
      lastPublishedAt: quota.lastPublishedAt,
    };
  }
}
