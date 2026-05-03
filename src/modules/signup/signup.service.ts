import { Injectable } from '@nestjs/common';
import { AttributionType, CoinTxnReason, User } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

type SignupSource = {
  creatorId?: string;
};

@Injectable()
export class SignupService {
  private static readonly SIGNUP_COIN_BONUS = 10;
  private static readonly SIGNUP_BONUS_SOURCE = 'SIGNUP_BONUS';
  private static readonly TRIAL_DAYS = 7;

  constructor(private readonly prisma: PrismaService) {}

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
    await this.maybeHandleCreatorAttributionAndFollow(user.id, source?.creatorId);
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
    creatorId?: string,
  ) {
    if (!creatorId || creatorId === userId) {
      return;
    }

    const creator = await this.prisma.user.findFirst({
      where: { id: creatorId, deletedAt: null },
      select: { id: true },
    });

    if (!creator) {
      return;
    }

    const existingCreatorAttribution = await this.prisma.attribution.findFirst({
      where: {
        userId,
        attributionType: AttributionType.CREATOR_PROFILE,
      },
      select: { id: true },
    });

    if (!existingCreatorAttribution) {
      await this.prisma.attribution.create({
        data: {
          userId,
          attributionType: AttributionType.CREATOR_PROFILE,
          creatorId,
        },
      });
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: creatorId,
        },
      },
      select: { id: true },
    });

    if (!existingFollow) {
      await this.prisma.follow.create({
        data: {
          followerId: userId,
          followingId: creatorId,
          followType: 'AUTO_SIGNUP',
          sourceCreatorId: creatorId,
        },
      });

      await this.prisma.creatorProfile.updateMany({
        where: { userId: creatorId },
        data: {
          totalFollowers: { increment: 1 },
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
