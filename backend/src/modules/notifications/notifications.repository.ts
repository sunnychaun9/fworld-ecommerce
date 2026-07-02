import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 * Notification data-access layer. **All Prisma queries live here**; the service
 * holds business logic only. Soft-deleted rows (deletedAt set) are excluded.
 */
@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.NotificationUncheckedCreateInput) {
    return this.prisma.notification.create({ data });
  }

  listByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null, deletedAt: null } });
  }

  findById(userId: string, id: string) {
    return this.prisma.notification.findFirst({ where: { id, userId, deletedAt: null } });
  }

  async markRead(userId: string, id: string, readAt: Date): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null, deletedAt: null },
      data: { readAt },
    });
  }

  async markAllRead(userId: string, readAt: Date): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null, deletedAt: null },
      data: { readAt },
    });
    return result.count;
  }
}
