import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class CreatorProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            profileLink: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    return profile;
  }

  async update(userId: string, data: { stageName?: string; tagline?: string; payoutEmail?: string }) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    return this.prisma.creatorProfile.update({
      where: { userId },
      data,
    });
  }

  async getStats(userId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    return {
      totalViews: profile.totalViews,
      totalSignups: profile.totalSignups,
      totalTipsReceived: profile.totalTipsReceived,
      totalTipAmount: profile.totalTipAmount,
      totalFollowers: profile.totalFollowers,
    };
  }
}
