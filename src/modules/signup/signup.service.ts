import { Injectable } from '@nestjs/common';
import { AttributionType, CoinTxnReason, User } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

type SignupSource = {
  creatorId?: string;
  videoId?: string;
  inviteId?: string;
};

@Injectable()
export class SignupService {
  private static readonly SIGNUP_COIN_BONUS = 10;
  private static readonly SIGNUP_BONUS_SOURCE = 'SIGNUP_BONUS';
  private static readonly TRIAL_DAYS = 7;

  constructor(private readonly prisma: PrismaService) { }

  async handleSignupFlow(user: Pick<User, 'id'>, source?: SignupSource) {
    const bonusId = this.getSignupBonusId(user.id);

    // Idempotency anchor: once signup bonus exists, flow is complete.
    const existingSignupBonus = await this.prisma.coinTransaction.findFirst({
      where: { userId: user.id, bonusId },
      select: { id: true },
    });

    if (existingSignupBonus) {
      return;
    }

    await this.activateTrial(user.id);
    await this.maybeHandleCreatorAttributionAndFollow(user.id, source);
    await this.creditSignupBonus(user.id, bonusId);
  }

  private async activateTrial(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isOnTrial: true,
        trialStartedAt: true,
        trialEndsAt: true,
      },
    });

    if (user?.isOnTrial && user.trialStartedAt && user.trialEndsAt) {
      return;
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + SignupService.TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        trialStartedAt: now,
        trialEndsAt,
        isOnTrial: true,
      },
    });
  }

  private async maybeHandleCreatorAttributionAndFollow(
    userId: string,
    source?: SignupSource,
  ) {
    if (!source?.creatorId && !source?.videoId && !source?.inviteId) {
      return;
    }

    const existingAttribution = await this.prisma.attribution.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (source.creatorId) {
      if (source.creatorId === userId) {
        return;
      }

      const creator = await this.prisma.user.findFirst({
        where: { id: source.creatorId, deletedAt: null },
        select: { id: true },
      });

      if (!creator) {
        return;
      }

      if (!existingAttribution) {
        await this.prisma.attribution.create({
          data: {
            userId,
            attributionType: AttributionType.CREATOR_PROFILE,
            creatorId: creator.id,
          },
        });
      }

      const existingFollow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: creator.id,
          },
        },
        select: { id: true },
      });

      if (!existingFollow) {
        await this.prisma.follow.create({
          data: {
            followerId: userId,
            followingId: creator.id,
            followType: 'AUTO_SIGNUP',
            sourceCreatorId: creator.id,
          },
        });

        await this.prisma.creatorProfile.updateMany({
          where: { userId: creator.id },
          data: {
            totalFollowers: { increment: 1 },
          },
        });
      }

      return;
    }

    if (source.videoId) {
      const sourceVideo = await this.prisma.video.findFirst({
        where: { id: source.videoId, deletedAt: null },
        select: { id: true, creatorId: true },
      });

      if (!sourceVideo) {
        return;
      }

      if (!existingAttribution) {
        await this.prisma.attribution.create({
          data: {
            userId,
            attributionType: AttributionType.VIDEO_LINK,
            creatorId: sourceVideo.creatorId,
            videoId: sourceVideo.id,
          },
        });
      }

      if (sourceVideo.creatorId === userId) {
        return;
      }

      const existingFollow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: sourceVideo.creatorId,
          },
        },
        select: { id: true },
      });

      if (!existingFollow) {
        await this.prisma.follow.create({
          data: {
            followerId: userId,
            followingId: sourceVideo.creatorId,
            followType: 'AUTO_SIGNUP',
            sourceCreatorId: sourceVideo.creatorId,
          },
        });

        await this.prisma.creatorProfile.updateMany({
          where: { userId: sourceVideo.creatorId },
          data: {
            totalFollowers: { increment: 1 },
          },
        });
      }

      return;
    }

    if (source.inviteId && !existingAttribution) {
      await this.prisma.attribution.create({
        data: {
          userId,
          attributionType: AttributionType.INVITE_LINK,
          inviteCode: source.inviteId,
        },
      });
    }
  }

  private async creditSignupBonus(userId: string, bonusId: string) {
    const existingSignupBonus = await this.prisma.coinTransaction.findFirst({
      where: { userId, bonusId },
      select: { id: true },
    });

    if (existingSignupBonus) {
      return;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        coinBalance: { increment: SignupService.SIGNUP_COIN_BONUS },
      },
      select: { coinBalance: true },
    });

    await this.prisma.coinTransaction.create({
      data: {
        userId,
        amount: SignupService.SIGNUP_COIN_BONUS,
        balanceAfter: updatedUser.coinBalance,
        reason: CoinTxnReason.BONUS,
        bonusId,
        metadata: {
          source: SignupService.SIGNUP_BONUS_SOURCE,
          type: 'CREDIT',
        },
      },
    });
  }

  private getSignupBonusId(userId: string) {
    return `${SignupService.SIGNUP_BONUS_SOURCE}:${userId}`;
  }
}
