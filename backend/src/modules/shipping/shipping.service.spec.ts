import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { ShippingRepository } from './shipping.repository';
import { ShippingService } from './shipping.service';

interface RepoMock {
  findById: ReturnType<typeof vi.fn>;
  findByOrderId: ReturnType<typeof vi.fn>;
  orderForShipment: ReturnType<typeof vi.fn>;
  findTrackingForOwner: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  markDelivered: ReturnType<typeof vi.fn>;
}

const OID = '01920000-0000-7000-8000-000000000a01';
const SID = '01920000-0000-7000-8000-000000000a02';

const CREATE = { orderId: OID, courier: 'BlueDart', trackingNumber: 'BD123' };

function makeService(): { service: ShippingService; repo: RepoMock } {
  const repo: RepoMock = {
    findById: vi.fn().mockResolvedValue({ id: SID, orderId: OID }),
    findByOrderId: vi.fn().mockResolvedValue(null),
    orderForShipment: vi
      .fn()
      .mockResolvedValue({ id: OID, status: 'CONFIRMED', paymentStatus: 'PAID' }),
    findTrackingForOwner: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: SID, orderId: OID }),
    update: vi.fn().mockResolvedValue({ id: SID, orderId: OID }),
    markDelivered: vi.fn().mockResolvedValue({ id: SID, orderId: OID, deliveredAt: new Date() }),
  };
  return { service: new ShippingService(repo as unknown as ShippingRepository), repo };
}

describe('ShippingService.create', () => {
  it('creates a shipment for a confirmed, paid order', async () => {
    const { service, repo } = makeService();
    await service.create(CREATE);
    expect(repo.create).toHaveBeenCalled();
  });

  it('returns 404 for a missing order', async () => {
    const { service, repo } = makeService();
    repo.orderForShipment.mockResolvedValue(null);
    await expect(service.create(CREATE)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a second shipment for the same order (409 SHIPMENT_EXISTS)', async () => {
    const { service, repo } = makeService();
    repo.findByOrderId.mockResolvedValue({ id: 'existing' });
    await expect(service.create(CREATE)).rejects.toMatchObject({
      response: { code: 'SHIPMENT_EXISTS' },
    });
  });

  it('rejects shipping an unconfirmed order (422 ORDER_NOT_CONFIRMED)', async () => {
    const { service, repo } = makeService();
    repo.orderForShipment.mockResolvedValue({ id: OID, status: 'PENDING', paymentStatus: 'PAID' });
    await expect(service.create(CREATE)).rejects.toMatchObject({
      response: { code: 'ORDER_NOT_CONFIRMED' },
    });
  });

  it('rejects shipping an unpaid order (422 PAYMENT_NOT_PAID)', async () => {
    const { service, repo } = makeService();
    repo.orderForShipment.mockResolvedValue({
      id: OID,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
    });
    await expect(service.create(CREATE)).rejects.toMatchObject({
      response: { code: 'PAYMENT_NOT_PAID' },
    });
  });

  it('maps a duplicate tracking number to 409 TRACKING_NUMBER_TAKEN', async () => {
    const { service, repo } = makeService();
    repo.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    await expect(service.create(CREATE)).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ShippingService.update', () => {
  it('marks the order delivered when delivered=true', async () => {
    const { service, repo } = makeService();
    await service.update(SID, { delivered: true });
    expect(repo.markDelivered).toHaveBeenCalledWith(SID, OID, expect.any(Date));
  });

  it('updates plain fields without delivering', async () => {
    const { service, repo } = makeService();
    await service.update(SID, { courier: 'Delhivery' });
    expect(repo.update).toHaveBeenCalled();
    expect(repo.markDelivered).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing shipment', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(null);
    await expect(service.update(SID, { courier: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ShippingService.tracking', () => {
  it('returns tracking fields for the order owner', async () => {
    const { service, repo } = makeService();
    repo.findTrackingForOwner.mockResolvedValue({
      courier: 'BlueDart',
      trackingNumber: 'BD123',
      trackingUrl: null,
      estimatedDelivery: null,
      shippedAt: new Date(),
      deliveredAt: null,
    });
    const result = await service.tracking('user-1', OID);
    expect(result.trackingNumber).toBe('BD123');
  });

  it('returns 404 when no shipment exists for the order/owner', async () => {
    const { service } = makeService();
    await expect(service.tracking('user-1', OID)).rejects.toBeInstanceOf(NotFoundException);
  });
});
