import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateNotificationDto, FindNotificationsDto, MarkReadDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: (dto.data || {}) as any,
        channel: dto.channel || 'IN_APP',
      },
    });
  }

  async findAll(userId: string, dto: FindNotificationsDto) {
    const { page = 1, limit = 20, unreadOnly = false } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markRead(userId: string, dto: MarkReadDto) {
    if (dto.markAll) {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (dto.notificationIds?.length) {
      await this.prisma.notification.updateMany({
        where: {
          id: { in: dto.notificationIds },
          userId,
        },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return { message: 'Notifications marked as read' };
  }

  async delete(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted' };
  }
}
