import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AttributionType } from '@prisma/client';

@Injectable()
export class AttributionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    attributionType: AttributionType;
    videoId?: string;
    creatorId?: string;
    inviteCode?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    countryCode?: string;
    city?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referringUrl?: string;
  }) {
    return this.prisma.attribution.create({ data });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [attributions, total] = await Promise.all([
      this.prisma.attribution.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          video: {
            select: { id: true, title: true, thumbnailUrl: true },
          },
        },
      }),
      this.prisma.attribution.count({ where: { userId } }),
    ]);

    return { data: attributions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStatsByCreator(creatorId: string) {
    const result = await this.prisma.attribution.groupBy({
      by: ['attributionType'],
      where: { creatorId },
      _count: true,
    });

    return result.map((r) => ({
      type: r.attributionType,
      count: r._count,
    }));
  }
}
