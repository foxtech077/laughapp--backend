import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateUserDto, UpdateUserDto, FindUsersDto, SelectRoleDto } from './dto/user.dto';
import { CoinTxnReason, UserType } from '@prisma/client';
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
    const user = await this.prisma.user.findFirst({
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
    const user = await this.prisma.user.findFirst({
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

  async selectRole(userId: string, dto: SelectRoleDto) {
    const { role } = dto;

    if (role !== 'FAN' && role !== 'CREATOR') {
      throw new BadRequestException('Only FAN or CREATOR can be selected');
    }

    await this.findOne(userId);

    if (role === 'FAN') {
      if (!dto.displayName || !dto.username) {
        throw new BadRequestException('displayName and username are required for FAN');
      }

      const existingUsername = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    if (role === 'CREATOR') {
      if (!dto.firstName || !dto.lastName || !dto.instagramLink || !dto.email) {
        throw new BadRequestException(
          'firstName, lastName, instagramLink, and email are required for CREATOR',
        );
      }

      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (existingEmail) {
        throw new ConflictException('User with this email already exists');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const displayNameForCreator =
        role === 'CREATOR' ? `${dto.firstName?.trim() ?? ''} ${dto.lastName?.trim() ?? ''}`.trim() : undefined;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          userType: role as UserType,
          displayName: role === 'FAN' ? dto.displayName : displayNameForCreator,
          username: role === 'FAN' ? dto.username : undefined,
          email: role === 'CREATOR' ? dto.email : undefined,
        },
        select: { id: true, userType: true },
      });

      if (role === 'CREATOR') {
        const existingProfile = await tx.creatorProfile.findUnique({
          where: { userId },
          select: { payoutInfo: true },
        });

        const existingPayoutInfo =
          existingProfile?.payoutInfo && typeof existingProfile.payoutInfo === 'object'
            ? (existingProfile.payoutInfo as Record<string, unknown>)
            : {};

        await tx.creatorProfile.upsert({
          where: { userId },
          update: {
            stageName: displayNameForCreator || 'New Creator',
            payoutEmail: dto.email,
            payoutInfo: {
              ...existingPayoutInfo,
              firstName: dto.firstName,
              lastName: dto.lastName,
              instagramLink: dto.instagramLink,
            },
          },
          create: {
            userId,
            stageName: displayNameForCreator || 'New Creator',
            payoutEmail: dto.email,
            payoutInfo: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              instagramLink: dto.instagramLink,
            },
          },
        });

        await tx.videoPublishQuota.upsert({
          where: { creatorId: userId },
          update: {},
          create: {
            creatorId: userId,
            dailyResetAt: new Date(),
            weeklyResetAt: new Date(),
          },
        });
      }

      return updatedUser;
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'User deleted successfully' };
  }

  async updateCoinBalance(userId: string, amount: number, reason: CoinTxnReason) {
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
        reason,
      },
    });

    return user;
  }

  async validatePassword(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
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
