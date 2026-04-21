import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateUserDto, UpdateUserDto, FindUsersDto } from './dto/user.dto';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check username uniqueness if provided
    if (dto.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate profile link
    const profileLink = dto.username
      ? `${dto.username}-${uuidv4().slice(0, 8)}`
      : `user-${uuidv4().slice(0, 8)}`;

    // Set trial period if FAN type
    const trialEndsAt = dto.userType === UserType.FAN
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        userType: dto.userType || UserType.FAN,
        profileLink,
        isOnTrial: !!trialEndsAt,
        trialStartedAt: trialEndsAt ? new Date() : null,
        trialEndsAt,
        coinBalance: dto.userType === UserType.FAN ? 10 : 0, // 10 free coins for FANs
      },
    });

    // If creator, create creator profile
    if (dto.userType === UserType.CREATOR) {
      await this.prisma.creatorProfile.create({
        data: {
          userId: user.id,
          stageName: dto.displayName || dto.username || 'New Creator',
        },
      });

      // Create video publish quota
      await this.prisma.videoPublishQuota.create({
        data: {
          creatorId: user.id,
          dailyResetAt: new Date(),
          weeklyResetAt: new Date(),
        },
      });
    }

    return this.findOne(user.id);
  }

  async findAll(dto: FindUsersDto) {
    const { userType, search, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (userType) {
      where.userType = userType;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        select: {
          id: true,
          userType: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          profileLink: true,
          isActive: true,
          isVerified: true,
          coinBalance: true,
          isOnTrial: true,
          trialEndsAt: true,
          createdAt: true,
          updatedAt: true,
          // Exclude passwordHash
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        creatorProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // Check exists

    if (dto.username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: { id },
        },
      });

      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: dto.username,
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        isActive: dto.isActive,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'User deleted successfully' };
  }

  async updateCoinBalance(userId: string, amount: number, reason: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        coinBalance: { increment: amount },
      },
    });

    await this.prisma.coinTransaction.create({
      data: {
        userId,
        amount,
        balanceAfter: user.coinBalance,
        reason: reason as any,
      },
    });

    return user;
  }

  async validatePassword(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async checkAndExpireTrial(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.isOnTrial && user?.trialEndsAt && new Date() > user.trialEndsAt) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isOnTrial: false,
        },
      });
    }
  }
}
