import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AdminOrdersRepository } from './admin-orders.repository';
import { AdminOrdersService } from './admin-orders.service';

interface RepoMock {
  list: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  updateStatus: ReturnType<typeof vi.fn>;
}

const OID = '01920000-0000-7000-8000-0000000000f1';

function makeService(
  order: Record<string, unknown> = { id: OID, status: 'PENDING', paymentStatus: 'PENDING' },
): {
  service: AdminOrdersService;
  repo: RepoMock;
} {
  const repo: RepoMock = {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    findById: vi.fn().mockResolvedValue(order),
    updateStatus: vi.fn().mockResolvedValue({ id: OID }),
  };
  return { service: new AdminOrdersService(repo as unknown as AdminOrdersRepository), repo };
}

describe('AdminOrdersService.updateStatus', () => {
  it('allows a valid transition (PENDING → CONFIRMED)', async () => {
    const { service, repo } = makeService({ id: OID, status: 'PENDING', paymentStatus: 'PENDING' });
    await service.updateStatus(OID, { status: 'CONFIRMED' });
    expect(repo.updateStatus).toHaveBeenCalledWith(OID, 'CONFIRMED', null);
  });

  it('rejects DELIVERED → PROCESSING (delivered is terminal)', async () => {
    const { service } = makeService({ id: OID, status: 'DELIVERED', paymentStatus: 'PAID' });
    await expect(service.updateStatus(OID, { status: 'PROCESSING' })).rejects.toMatchObject({
      response: { code: 'INVALID_STATUS_TRANSITION' },
    });
  });

  it('rejects any transition out of CANCELLED (terminal)', async () => {
    const { service } = makeService({ id: OID, status: 'CANCELLED', paymentStatus: 'PENDING' });
    await expect(service.updateStatus(OID, { status: 'CONFIRMED' })).rejects.toMatchObject({
      response: { code: 'INVALID_STATUS_TRANSITION' },
    });
  });

  it('rejects SHIPPED when payment is not PAID', async () => {
    const { service, repo } = makeService({
      id: OID,
      status: 'PROCESSING',
      paymentStatus: 'PENDING',
    });
    await expect(service.updateStatus(OID, { status: 'SHIPPED' })).rejects.toMatchObject({
      response: { code: 'PAYMENT_NOT_PAID' },
    });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('allows SHIPPED when payment is PAID', async () => {
    const { service, repo } = makeService({ id: OID, status: 'PROCESSING', paymentStatus: 'PAID' });
    await service.updateStatus(OID, { status: 'SHIPPED', note: 'dispatched' });
    expect(repo.updateStatus).toHaveBeenCalledWith(OID, 'SHIPPED', 'dispatched');
  });

  it('returns 404 for a missing order', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(null);
    await expect(service.updateStatus(OID, { status: 'CONFIRMED' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('AdminOrdersService.list', () => {
  it('returns a paginated envelope', async () => {
    const { service, repo } = makeService();
    repo.list.mockResolvedValue({ items: [{ id: OID }], total: 1 });
    const result = await service.list({ page: 2, pageSize: 10 });
    expect(result).toMatchObject({ total: 1, page: 2, pageSize: 10 });
    expect(repo.list).toHaveBeenCalledWith({}, 10, 10);
  });

  it('filters by status when provided', async () => {
    const { service, repo } = makeService();
    await service.list({ status: 'CONFIRMED', page: 1, pageSize: 20 });
    expect(repo.list).toHaveBeenCalledWith({ status: 'CONFIRMED' }, 0, 20);
  });
});
