import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ReturnsRepository } from './returns.repository';
import { ReturnsService } from './returns.service';

interface RepoMock {
  findOrderItemContext: ReturnType<typeof vi.fn>;
  findByOrderItemId: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  findManyByUser: ReturnType<typeof vi.fn>;
  findByIdForUser: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const OII = '01920000-0000-7000-8000-000000000a01';
const RID = '01920000-0000-7000-8000-000000000a02';

function context(overrides: Record<string, unknown> = {}) {
  return {
    id: OII,
    orderId: 'order-1',
    lineTotal: 800,
    order: {
      userId: USER,
      status: 'DELIVERED',
      updatedAt: new Date(),
      shipment: { deliveredAt: new Date() },
      ...overrides,
    },
  };
}

function makeService(): { service: ReturnsService; repo: RepoMock } {
  const repo: RepoMock = {
    findOrderItemContext: vi.fn().mockResolvedValue(context()),
    findByOrderItemId: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: RID, status: 'REQUESTED' }),
    findManyByUser: vi.fn().mockResolvedValue([]),
    findByIdForUser: vi.fn().mockResolvedValue({ id: RID, userId: USER }),
    findById: vi.fn().mockResolvedValue({ id: RID, status: 'REQUESTED' }),
    update: vi.fn().mockResolvedValue({ id: RID, status: 'APPROVED' }),
  };
  return { service: new ReturnsService(repo as unknown as ReturnsRepository), repo };
}

describe('ReturnsService.create', () => {
  it('creates a return with refund amount from the line total', async () => {
    const { service, repo } = makeService();
    await service.create(USER, { orderItemId: OII, reason: 'defective' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ refundAmount: 800, status: 'REQUESTED' }),
    );
  });

  it('returns 404 when the order item does not exist', async () => {
    const { service, repo } = makeService();
    repo.findOrderItemContext.mockResolvedValue(null);
    await expect(service.create(USER, { orderItemId: OII, reason: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('enforces user isolation (404 for another user’s item)', async () => {
    const { service, repo } = makeService();
    repo.findOrderItemContext.mockResolvedValue(context({ userId: 'someone-else' }));
    await expect(service.create(USER, { orderItemId: OII, reason: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a non-delivered order (422 ORDER_NOT_DELIVERED)', async () => {
    const { service, repo } = makeService();
    repo.findOrderItemContext.mockResolvedValue(context({ status: 'SHIPPED' }));
    await expect(service.create(USER, { orderItemId: OII, reason: 'x' })).rejects.toMatchObject({
      response: { code: 'ORDER_NOT_DELIVERED' },
    });
  });

  it('rejects a return outside the 7-day window (422 RETURN_WINDOW_EXPIRED)', async () => {
    const { service, repo } = makeService();
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    repo.findOrderItemContext.mockResolvedValue(
      context({ shipment: { deliveredAt: eightDaysAgo }, updatedAt: eightDaysAgo }),
    );
    await expect(service.create(USER, { orderItemId: OII, reason: 'x' })).rejects.toMatchObject({
      response: { code: 'RETURN_WINDOW_EXPIRED' },
    });
  });

  it('rejects a second return for the same item (409 RETURN_EXISTS)', async () => {
    const { service, repo } = makeService();
    repo.findByOrderItemId.mockResolvedValue({ id: 'existing' });
    await expect(service.create(USER, { orderItemId: OII, reason: 'x' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('ReturnsService.adminUpdate', () => {
  it('advances REQUESTED → APPROVED', async () => {
    const { service, repo } = makeService();
    await service.adminUpdate(RID, { status: 'APPROVED', decisionReason: 'ok' });
    expect(repo.update).toHaveBeenCalledWith(
      RID,
      expect.objectContaining({ status: 'APPROVED', decisionReason: 'ok' }),
    );
  });

  it('rejects an invalid transition (REFUNDED → APPROVED)', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({ id: RID, status: 'REFUNDED' });
    await expect(service.adminUpdate(RID, { status: 'APPROVED' })).rejects.toMatchObject({
      response: { code: 'INVALID_RETURN_TRANSITION' },
    });
  });

  it('returns 404 for a missing return', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(null);
    await expect(service.adminUpdate(RID, { status: 'APPROVED' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('ReturnsService.getById', () => {
  it('returns 404 when not owned by the user', async () => {
    const { service, repo } = makeService();
    repo.findByIdForUser.mockResolvedValue(null);
    await expect(service.getById(USER, RID)).rejects.toBeInstanceOf(NotFoundException);
  });
});
