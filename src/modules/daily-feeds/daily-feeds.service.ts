import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { GenerateFeedDto, FindFeedsDto } from './dto/daily-feed.dto';
import { FeedStatus, VideoStatus } from '@prisma/client';

@Injectable()
export class DailyFeedsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(dto: GenerateFeedDto) {
    const feedDate = new Date(dto.feedDate);
    feedDate.setHours(0, 0, 0, 0);

    // Check if feed already exists
    const existingFeed = await this.prisma.dailyFeed.findUnique({
      where: { feedDate },
    });

    if (existingFeed) {
      throw new Error('Feed for this date already exists');
    }

    const startTime = Date.now();

    // Get all published videos from the past day with their stats
    const videos = await this.prisma.video.findMany({
      where: {
        status: VideoStatus.PUBLISHED,
        isActive: true,
        publishedAt: {
          gte: new Date(feedDate.getTime() - 24 * 60 * 60 * 1000),
          lt: feedDate,
        },
      },
      select: {
        id: true,
        viewCount: true,
        signupCount: true,
        tipCount: true,
        tipAmount: true,
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Calculate scores using the formula:
    // score = (5 * signupScore) + (3 * tipScore) + sqrt(viewScore)
    const scoredVideos = videos.map((video) => {
      const viewScore = Number(video.viewCount);
      const signupScore = Number(video.signupCount);
      const tipScore = Number(video.tipCount);
      const tipAmountScore = Number(video.tipAmount);

      const score = 5 * signupScore + 3 * tipScore + Math.sqrt(viewScore);

      return {
        videoId: video.id,
        viewCount: video.viewCount,
        signupCount: video.signupCount,
        tipCount: video.tipCount,
        tipAmount: video.tipAmount,
        viewScore: Math.sqrt(viewScore),
        signupScore,
        tipScore,
        score,
        creator: video.creator,
      };
    });

    // Sort by score descending
    scoredVideos.sort((a, b) => b.score - a.score);

    // Take top 50
    const topVideos = scoredVideos.slice(0, 50);

    const duration = Date.now() - startTime;

    // Create feed with entries in transaction
    const feed = await this.prisma.$transaction(async (tx) => {
      const newFeed = await tx.dailyFeed.create({
        data: {
          feedDate,
          status: FeedStatus.DRAFT,
          generatedAt: new Date(),
          totalVideos: topVideos.length,
          generationDurationMs: duration,
        },
      });

      // Create entries
      for (let i = 0; i < topVideos.length; i++) {
        const entry = topVideos[i];
        await tx.dailyFeedEntry.create({
          data: {
            feedId: newFeed.id,
            videoId: entry.videoId,
            rank: i + 1,
            score: entry.score,
            viewCount: entry.viewCount,
            signupCount: entry.signupCount,
            tipCount: entry.tipCount,
            tipAmount: entry.tipAmount,
            viewScore: entry.viewScore,
            signupScore: entry.signupScore,
            tipScore: entry.tipScore,
          },
        });
      }

      return newFeed;
    });

    return this.findOne(feed.id);
  }

  async publish(id: string) {
    const feed = await this.prisma.dailyFeed.update({
      where: { id },
      data: {
        status: FeedStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    return feed;
  }

  async findAll(dto: FindFeedsDto) {
    const { date, status, page = 1, limit = 50 } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (date) {
      where.feedDate = new Date(date);
    }

    if (status) {
      where.status = status;
    }

    const [feeds, total] = await Promise.all([
      this.prisma.dailyFeed.findMany({
        where,
        skip,
        take: limit,
        orderBy: { feedDate: 'desc' },
        include: {
          entries: {
            take: 10,
            orderBy: { rank: 'asc' },
            include: {
              video: {
                select: {
                  id: true,
                  title: true,
                  thumbnailUrl: true,
                  creator: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.dailyFeed.count({ where }),
    ]);

    return {
      data: feeds,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const feed = await this.prisma.dailyFeed.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { rank: 'asc' },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                creator: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!feed) {
      throw new NotFoundException('Feed not found');
    }

    return feed;
  }

  async findByDate(dateStr: string) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const feed = await this.prisma.dailyFeed.findUnique({
      where: { feedDate: date },
      include: {
        entries: {
          orderBy: { rank: 'asc' },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                creator: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!feed) {
      throw new NotFoundException('No feed found for this date');
    }

    return feed;
  }
}
