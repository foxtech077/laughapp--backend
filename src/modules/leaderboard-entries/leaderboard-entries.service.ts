import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { GetLeaderboardDto } from './dto/leaderboard.dto';

@Injectable()
export class LeaderboardEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(dto: GetLeaderboardDto) {
    const { hourKey, page = 1, limit = 50 } = dto;
    const skip = (page - 1) * limit;

    // If no hourKey provided, get the latest
    let targetHourKey = hourKey;

    if (!targetHourKey) {
      const latest = await this.prisma.leaderboardEntry.findFirst({
        orderBy: { hourKey: 'desc' },
        select: { hourKey: true },
      });

      if (!latest) {
        return {
          hourKey: null,
          generatedAt: null,
          entries: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      targetHourKey = latest.hourKey;
    }

    const [entries, total] = await Promise.all([
      this.prisma.leaderboardEntry.findMany({
        where: { hourKey: targetHourKey },
        skip,
        take: limit,
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
      }),
      this.prisma.leaderboardEntry.count({ where: { hourKey: targetHourKey } }),
    ]);

    const transformed = entries.map((e) => ({
      rank: e.rank,
      score: e.score,
      videoId: e.videoId,
      title: e.video.title,
      thumbnailUrl: e.video.thumbnailUrl,
      creator: e.video.creator,
      viewCount: e.viewCount,
      signupCount: e.signupCount,
      tipCount: e.tipCount,
      tipAmount: e.tipAmount,
    }));

    return {
      hourKey: targetHourKey,
      generatedAt: entries[0]?.updatedAt || null,
      entries: transformed,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateHourlyLeaderboard() {
    // Get current hour key
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;

    // Get all published videos from today's feed with updated stats
    const videos = await this.prisma.video.findMany({
      where: {
        isActive: true,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        viewCount: true,
        uniqueViewCount: true,
        signupCount: true,
        tipCount: true,
        tipAmount: true,
      },
    });

    // Calculate scores
    const scoredVideos = videos.map((video) => {
      const viewScore = Number(video.viewCount);
      const signupScore = Number(video.signupCount);
      const tipScore = Number(video.tipCount);

      const score = 5 * signupScore + 3 * tipScore + Math.sqrt(viewScore);

      return {
        videoId: video.id,
        score,
        viewCount: video.viewCount,
        uniqueViewCount: video.uniqueViewCount,
        signupCount: video.signupCount,
        tipCount: video.tipCount,
        tipAmount: video.tipAmount,
      };
    });

    // Sort by score
    scoredVideos.sort((a, b) => b.score - a.score);

    // Update or create entries
    for (let i = 0; i < scoredVideos.length; i++) {
      const entry = scoredVideos[i];
      await this.prisma.leaderboardEntry.upsert({
        where: {
          videoId_hourKey: {
            videoId: entry.videoId,
            hourKey,
          },
        },
        create: {
          videoId: entry.videoId,
          hourKey,
          rank: i + 1,
          score: entry.score,
          viewCount: entry.viewCount,
          uniqueViewCount: entry.uniqueViewCount,
          signupCount: entry.signupCount,
          tipCount: entry.tipCount,
          tipAmount: entry.tipAmount,
        },
        update: {
          rank: i + 1,
          score: entry.score,
          viewCount: entry.viewCount,
          uniqueViewCount: entry.uniqueViewCount,
          signupCount: entry.signupCount,
          tipCount: entry.tipCount,
          tipAmount: entry.tipAmount,
        },
      });
    }

    return { hourKey, updatedVideos: scoredVideos.length };
  }
}
