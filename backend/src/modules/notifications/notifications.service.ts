import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { CreateNotificationDto, UUID_PATTERN } from './dto/create-notification.dto';
import { NotificationsRepository } from './notifications.repository';

/**
 * Notification center. User-scoped listing with an unread count, per-item and
 * bulk read marking, and admin-driven creation. Holds business logic only; every
 * Prisma query is delegated to {@link NotificationsRepository}.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async list(userId: string) {
    const [items, unreadCount] = await Promise.all([
      this.repository.listByUser(userId),
      this.repository.unreadCount(userId),
    ]);
    return { items, unreadCount };
  }

  async markRead(userId: string, id: string) {
    await this.getOwned(userId, id);
    await this.repository.markRead(userId, id, new Date());
    return this.repository.findById(userId, id);
  }

  async markAllRead(userId: string) {
    const updated = await this.repository.markAllRead(userId, new Date());
    return { updated };
  }

  create(dto: CreateNotificationDto) {
    return this.repository.create({
      id: newId(),
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: dto.data ? (dto.data as Prisma.InputJsonValue) : undefined,
    });
  }

  private async getOwned(userId: string, id: string) {
    if (!UUID_PATTERN.test(id)) {
      throw this.notFound();
    }
    const notification = await this.repository.findById(userId, id);
    if (!notification) {
      throw this.notFound();
    }
    return notification;
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Notification not found' });
  }
}
