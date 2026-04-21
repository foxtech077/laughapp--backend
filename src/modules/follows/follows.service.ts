import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { FollowDto, FindFollowsDto } from './dto/follow.dto';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(followerId: string, dto: FollowDto) {
    if (followerId === dto.followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if user exists
    const userToFollow = await this.prisma.user.findFirst({
      where: { id: dto.followingId, deletedAt: null },
    });

    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: dto.followingId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Already following this user');
    }

    const follow = await this.prisma.follow.create({
      data: {
        followerId,
        followingId: dto.followingId,
        followType: 'MANUAL',
      },
    });

    // Update follower counts
    await this.prisma.creatorProfile.updateMany({
      where: { userId: dto.followingId },
      data: {
        totalFollowers: { increment: 1 },
      },
    });

    return follow;
  }

  async unfollow(followerId: string, followingId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Not following this user');
    }

    await this.prisma.follow.delete({
      where: { id: existing.id },
    });

    // Update follower counts
    await this.prisma.creatorProfile.updateMany({
      where: { userId: followingId },
      data: {
        totalFollowers: { decrement: 1 },
      },
    });

    return { message: 'Unfollowed successfully' };
  }

  async findAll(dto: FindFollowsDto) {
    const { followerId, followingId, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (followerId) where.followerId = followerId;
    if (followingId) where.followingId = followingId;

    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              creatorProfile: {
                select: {
                  stageName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.follow.count({ where }),
    ]);

    return {
      data: follows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    return this.findAll({ followingId: userId, page, limit });
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    return this.findAll({ followerId: userId, page, limit });
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return { isFollowing: !!follow };
  }
}
