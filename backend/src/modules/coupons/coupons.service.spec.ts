import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { CouponsRepository } from './coupons.repository';
import { CouponsService } from './coupons.service';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findByCode: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  countUsages: ReturnType<typeof vi.fn>;
  countUserUsages: ReturnType<typeof vi.fn>;
  listActiveValid: ReturnType<typeof vi.fn>;
}

function coupon(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    code: 'SAVE10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: null,
    maxDiscount: null,
    usageLimit: null,
    perUserLimit: null,
    validFrom: null,
    validTo: null,
    active: true,
    ...overrides,
  };
}

function makeService(): { service: CouponsService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue(coupon()),
    findById: vi.fn().mockResolvedValue(coupon()),
    findByCode: vi.fn().mockResolvedValue(coupon()),
    update: vi.fn().mockResolvedValue(coupon()),
    delete: vi.fn(),
    countUsages: vi.fn().mockResolvedValue(0),
    countUserUsages: vi.fn().mockResolvedValue(0),
    listActiveValid: vi.fn().mockResolvedValue([]),
  };
  return { service: new CouponsService(repo as unknown as CouponsRepository), repo };
}

const HOUR = 60 * 60 * 1000;

describe('CouponsService.validate', () => {
  it('applies a percentage discount', async () => {
    const { service } = makeService();
    const result = await service.validate({ code: 'save10', orderAmount: 1000 });
    expect(result).toEqual({
      valid: true,
      discount: 100,
      finalAmount: 900,
      message: 'Coupon applied',
    });
  });

  it('caps a percentage discount at maxDiscount', async () => {
    const { service, repo } = makeService();
    repo.findByCode.mockResolvedValue(coupon({ discountValue: 50, maxDiscount: 200 }));
    const result = await service.validate({ code: 'SAVE', orderAmount: 1000 });
    expect(result.discount).toBe(200);
    expect(result.finalAmount).toBe(800);
  });

  it('applies a flat discount capped at the order amount', async () => {
    const { service, repo } = makeService();
    repo.findByCode.mockResolvedValue(coupon({ discountType: 'FLAT', discountValue: 2000 }));
    const result = await service.validate({ code: 'FLAT', orderAmount: 1000 });
    expect(result.discount).toBe(1000);
    expect(result.finalAmount).toBe(0);
  });

  it('rejects an unknown coupon', async () => {
    const { service, repo } = makeService();
    repo.findByCode.mockResolvedValue(null);
    expect((await service.validate({ code: 'X', orderAmount: 100 })).valid).toBe(false);
  });

  it('rejects an inactive coupon', async () => {
    const { service, repo } = makeService();
    repo.findByCode.mockResolvedValue(coupon({ active: false }));
    expect((await service.validate({ code: 'X', orderAmount: 100 })).valid).toBe(false);
  });

  it('rejects an expired coupon', async () => {
    const { service, repo } = makeService();
    repo.findByCode.mockResolvedValue(coupon({ validTo: new Date(Date.now() - HOUR) }));
    const result = await service.validate({ code: 'X', orderAmount: 100 });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/expired/i);
  });

  it('rejects a coupon that is not yet valid', async () => {
    const { service, repo } = makeService();
    repo.findByCode.mockResolvedValue(coupon({ validFrom: new Date(Date.now() + HOUR) }));
    expect((await service.validate({ code: 'X', orderAmount: 100 })).valid).toBe(false);
  });

  it('rejects an order below the minimum amount', async () => {
    const { service, repo } = makeService();
    repo.findByCode.mockResolvedValue(coupon({ minOrderAmount: 500 }));
    expect((await service.validate({ code: 'X', orderAmount: 100 })).valid).toBe(false);
  });

  it('rejects when the global usage limit is reached', async () => {
    const { service, repo } = makeService();
    repo.findByCode.mockResolvedValue(coupon({ usageLimit: 5 }));
    repo.countUsages.mockResolvedValue(5);
    expect((await service.validate({ code: 'X', orderAmount: 1000 })).valid).toBe(false);
  });

  it('rejects when the per-user limit is reached', async () => {
    const { service, repo } = makeService();
    repo.findByCode.mockResolvedValue(coupon({ perUserLimit: 1 }));
    repo.countUserUsages.mockResolvedValue(1);
    expect((await service.validate({ code: 'X', orderAmount: 1000 }, 'user-1')).valid).toBe(false);
  });
});

describe('CouponsService CRUD', () => {
  it('normalizes the code and creates a coupon', async () => {
    const { service, repo } = makeService();
    await service.create({ code: ' save10 ', discountType: 'PERCENTAGE', discountValue: 10 });
    expect(repo.create.mock.calls[0]?.[0]).toMatchObject({ code: 'SAVE10' });
  });

  it('maps a duplicate code to 409 COUPON_CODE_TAKEN', async () => {
    const { service, repo } = makeService();
    repo.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    await expect(
      service.create({ code: 'SAVE10', discountType: 'FLAT', discountValue: 100 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
