import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateVideoDto, UpdateVideoDto, FindVideosDto } from './dto/video.dto';
import { VideoStatus } from '@prisma/client';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(creatorId: string, dto: CreateVideoDto) {
    // Check if user is a creator
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (!user || user.userType !== 'CREATOR') {
      throw new ForbiddenException('Only creators can publish videos');
    }

    // Check publishing quota
    const quota = await this.checkQuota(creatorId);
    if (!quota.canPublish) {
      throw new BadRequestException(quota.reason);
    }

    const video = await this.prisma.video.create({
      data: {
        creatorId,
        title: dto.title,
        description: dto.description,
        hashtags: dto.hashtags,
        videoUrl: dto.videoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        durationSeconds: dto.durationSeconds,
        status: VideoStatus.PROCESSING,
      },
    });

    // Update quota
    await this.updateQuota(creatorId);

    return video;
  }

  async findAll(dto: FindVideosDto) {
    const {
      creatorId,
      status,
      page = 1,
      limit = 20,
      sortBy = 'publishedAt',
      order = 'desc',
    } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
      isActive: true,
    };

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = VideoStatus.PUBLISHED; // Default to published only
    }

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              creatorProfile: {
                select: {
                  stageName: true,
                  isFeatured: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      data: videos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id, deletedAt: null },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            creatorProfile: {
              select: {
                stageName: true,
                isFeatured: true,
              },
            },
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async update(id: string, creatorId: string, dto: UpdateVideoDto) {
    const video = await this.findOne(id);

    if (video.creatorId !== creatorId) {
      throw new ForbiddenException('You can only update your own videos');
    }

    return this.prisma.video.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        hashtags: dto.hashtags,
        thumbnailUrl: dto.thumbnailUrl,
        status: dto.status,
      },
    });
  }

  async publish(id: string, creatorId: string) {
    const video = await this.findOne(id);

    if (video.creatorId !== creatorId) {
      throw new ForbiddenException('You can only publish your own videos');
    }

    if (video.status !== VideoStatus.PROCESSING) {
      throw new BadRequestException('Video is not in processing state');
    }

    return this.prisma.video.update({
      where: { id },
      data: {
        status: VideoStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  async remove(id: string, creatorId: string) {
    const video = await this.findOne(id);

    if (video.creatorId !== creatorId) {
      throw new ForbiddenException('You can only delete your own videos');
    }

    return this.prisma.video.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async recordView(id: string) {
    const video = await this.prisma.video.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });

    // Update creator profile stats
    await this.prisma.creatorProfile.update({
      where: { userId: video.creatorId },
      data: {
        totalViews: { increment: 1 },
      },
    });

    return video;
  }

  async recordSignup(id: string) {
    return this.prisma.video.update({
      where: { id },
      data: {
        signupCount: { increment: 1 },
      },
    });
  }

  async recordTip(id: string, amount: number) {
    const video = await this.prisma.video.update({
      where: { id },
      data: {
        tipCount: { increment: 1 },
        tipAmount: { increment: amount },
      },
    });

    // Update creator profile
    await this.prisma.creatorProfile.update({
      where: { userId: video.creatorId },
      data: {
        totalTipsReceived: { increment: 1 },
        totalTipAmount: { increment: amount },
      },
    });

    return video;
  }

  private async checkQuota(creatorId: string) {
    const quota = await this.prisma.videoPublishQuota.findUnique({
      where: { creatorId },
    });

    if (!quota) {
      // Create default quota
      const newQuota = await this.prisma.videoPublishQuota.create({
        data: {
          creatorId,
          dailyResetAt: new Date(),
          weeklyResetAt: new Date(),
        },
      });
      return { canPublish: true, quota: newQuota };
    }

    const now = new Date();

    // Check if blocked
    if (quota.isBlocked && quota.blockedUntil && now < quota.blockedUntil) {
      return { canPublish: false, reason: `Publishing blocked until ${quota.blockedUntil}` };
    }

    // Check daily reset
    if (quota.dailyResetAt && now > quota.dailyResetAt) {
      await this.prisma.videoPublishQuota.update({
        where: { creatorId },
        data: {
          publishedThisDay: 0,
          dailyResetAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      });
      return { canPublish: true, quota };
    }

    // Check weekly reset
    if (quota.weeklyResetAt && now > quota.weeklyResetAt) {
      await this.prisma.videoPublishQuota.update({
        where: { creatorId },
        data: {
          publishedThisWeek: 0,
          weeklyResetAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return { canPublish: true, quota };
    }

    // Check limits
    if (quota.publishedThisDay >= 1) {
      return { canPublish: false, reason: 'Daily video limit reached (1 per day)' };
    }

    if (quota.publishedThisWeek >= 3) {
      return { canPublish: false, reason: 'Weekly video limit reached (3 per 7 days)' };
    }

    return { canPublish: true, quota };
  }

  private async updateQuota(creatorId: string) {
    const now = new Date();
    await this.prisma.videoPublishQuota.update({
      where: { creatorId },
      data: {
        lastPublishedAt: now,
        publishedThisHour: { increment: 1 },
        publishedThisDay: { increment: 1 },
        publishedThisWeek: { increment: 1 },
        hourlyResetAt: new Date(now.getTime() + 60 * 60 * 1000),
      },
    });
  }
}
