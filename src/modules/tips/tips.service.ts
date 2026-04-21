import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateTipDto, FindTipsDto } from './dto/tip.dto';
import { UsersService } from '../users/users.service';
import { VideosService } from '../videos/videos.service';

@Injectable()
export class TipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly videosService: VideosService,
  ) {}

  async create(fanId: string, dto: CreateTipDto) {
    // Get fan with trial status
    const fan = await this.usersService.findOne(fanId);

    // Get video and creator
    const video = await this.videosService.findOne(dto.videoId);
    const creatorId = video.creatorId;

    if (creatorId === fanId) {
      throw new BadRequestException('You cannot tip your own video');
    }

    let amount: number;
    let isTrialTip = false;
    let isPostTrialTip = false;
    let tipSequenceInTrial: number | null = null;
    let trialTipsRemaining: number | null = null;

    // Determine tip amount based on trial status
    if (fan.isOnTrial) {
      // Trial tip: always 1 coin
      amount = 1;
      isTrialTip = true;

      if (fan.coinBalance < 1) {
        throw new BadRequestException('Insufficient coins. Please purchase more.');
      }

      // Get current trial tips count
      const trialTipsCount = await this.prisma.tip.count({
        where: { fanId, isTrialTip: true },
      });

      tipSequenceInTrial = trialTipsCount + 1;
      trialTipsRemaining = Math.max(0, 10 - trialTipsCount - 1);
    } else {
      // Post-trial: default 15 coins
      amount = 15;
      isPostTrialTip = true;

      if (fan.coinBalance < 15) {
        throw new BadRequestException('Insufficient coins. Please purchase more.');
      }
    }

    // Create tip in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct from fan
      const updatedFan = await tx.user.update({
        where: { id: fanId },
        data: {
          coinBalance: { decrement: amount },
          lastTipSentAt: new Date(),
        },
      });

      if (updatedFan.coinBalance < 0) {
        throw new BadRequestException('Insufficient coins');
      }

      // Add to creator
      await tx.user.update({
        where: { id: creatorId },
        data: {
          coinBalance: { increment: amount },
          lastTipReceivedAt: new Date(),
        },
      });

      // Create tip
      const tip = await tx.tip.create({
        data: {
          fanId,
          creatorId,
          videoId: dto.videoId,
          amount,
          isTrialTip,
          isPostTrialTip,
          message: dto.message,
          tipSequenceInTrial,
          trialTipsRemaining,
        },
      });

      // Record coin transactions
      await tx.coinTransaction.create({
        data: {
          userId: fanId,
          amount: -amount,
          balanceAfter: updatedFan.coinBalance,
          reason: 'TIP_SENT',
          tipId: tip.id,
        },
      });

      const creator = await tx.user.findUnique({ where: { id: creatorId } });
      await tx.coinTransaction.create({
        data: {
          userId: creatorId,
          amount,
          balanceAfter: creator!.coinBalance,
          reason: 'TIP_RECEIVED',
          tipId: tip.id,
        },
      });

      return tip;
    });

    // Update video stats
    await this.videosService.recordTip(dto.videoId, amount);

    // Update follower stats
    await this.prisma.creatorProfile.update({
      where: { userId: creatorId },
      data: {
        totalTipAmount: { increment: BigInt(amount) },
      },
    });

    return result;
  }

  async findAll(dto: FindTipsDto) {
    const { fanId, creatorId, videoId, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (fanId) where.fanId = fanId;
    if (creatorId) where.creatorId = creatorId;
    if (videoId) where.videoId = videoId;

    const [tips, total] = await Promise.all([
      this.prisma.tip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fan: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          video: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
            },
          },
        },
      }),
      this.prisma.tip.count({ where }),
    ]);

    return {
      data: tips,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const tip = await this.prisma.tip.findUnique({
      where: { id },
      include: {
        fan: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            videoUrl: true,
          },
        },
      },
    });

    if (!tip) {
      throw new NotFoundException('Tip not found');
    }

    return tip;
  }
}
