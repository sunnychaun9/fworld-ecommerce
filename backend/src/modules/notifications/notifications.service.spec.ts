import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  listByUser: ReturnType<typeof vi.fn>;
  unreadCount: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  markRead: ReturnType<typeof vi.fn>;
  markAllRead: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const NID = '01920000-0000-7000-8000-000000000b01';

function makeService(): { service: NotificationsService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue({ id: NID }),
    listByUser: vi.fn().mockResolvedValue([{ id: NID }]),
    unreadCount: vi.fn().mockResolvedValue(3),
    findById: vi.fn().mockResolvedValue({ id: NID, userId: USER, readAt: null }),
    markRead: vi.fn(),
    markAllRead: vi.fn().mockResolvedValue(3),
  };
  return { service: new NotificationsService(repo as unknown as NotificationsRepository), repo };
}

describe('NotificationsService', () => {
  it('lists notifications with an unread count', async () => {
    const { service } = makeService();
    const result = await service.list(USER);
    expect(result.items).toHaveLength(1);
    expect(result.unreadCount).toBe(3);
  });

  it('marks a single owned notification read', async () => {
    const { service, repo } = makeService();
    await service.markRead(USER, NID);
    expect(repo.markRead).toHaveBeenCalledWith(USER, NID, expect.any(Date));
  });

  it('returns 404 marking a notification not owned by the user', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(null);
    await expect(service.markRead(USER, NID)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.markRead).not.toHaveBeenCalled();
  });

  it('returns 404 for a non-UUID id', async () => {
    const { service, repo } = makeService();
    await expect(service.markRead(USER, 'nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('marks all as read and returns the updated count', async () => {
    const { service } = makeService();
    await expect(service.markAllRead(USER)).resolves.toEqual({ updated: 3 });
  });

  it('creates a notification for a user', async () => {
    const { service, repo } = makeService();
    await service.create({ userId: USER, type: 'ORDER', title: 'Shipped', message: 'On the way' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER, type: 'ORDER', title: 'Shipped' }),
    );
  });
});
