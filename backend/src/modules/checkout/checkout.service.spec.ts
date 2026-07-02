import { describe, expect, it, vi } from 'vitest';

import { CheckoutRepository } from './checkout.repository';
import { CheckoutService } from './checkout.service';

interface RepoMock {
  findCartForCheckout: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';

function item(overrides: Record<string, unknown> = {}) {
  return {
    id: 'i1',
    quantity: 2,
    variant: {
      id: 'v1',
      sku: 'A',
      size: 'M',
      color: 'Black',
      colorHex: null,
      priceOverride: null,
      inventory: { availableStock: 10 },
      product: {
        id: 'p1',
        name: 'Tee',
        slug: 'tee',
        status: 'ACTIVE',
        mrp: 1000,
        sellingPrice: 800,
        images: [{ id: 'img1', url: 'u', sortOrder: 0 }],
      },
    },
    ...overrides,
  };
}

function variant(overrides: Record<string, unknown> = {}) {
  return { ...item().variant, ...overrides };
}

function makeService(): { service: CheckoutService; repo: RepoMock } {
  const repo: RepoMock = { findCartForCheckout: vi.fn() };
  return { service: new CheckoutService(repo as unknown as CheckoutRepository), repo };
}

describe('CheckoutService', () => {
  it('rejects a missing cart (422 EMPTY_CART)', async () => {
    const { service, repo } = makeService();
    repo.findCartForCheckout.mockResolvedValue(null);
    await expect(service.prepare(USER, { couponCode: null })).rejects.toMatchObject({
      response: { code: 'EMPTY_CART' },
    });
  });

  it('rejects an empty cart (422 EMPTY_CART)', async () => {
    const { service, repo } = makeService();
    repo.findCartForCheckout.mockResolvedValue({ id: 'c1', items: [] });
    await expect(service.prepare(USER, { couponCode: null })).rejects.toMatchObject({
      response: { code: 'EMPTY_CART' },
    });
  });

  it('rejects an inactive product (422 PRODUCT_NOT_ACTIVE)', async () => {
    const { service, repo } = makeService();
    repo.findCartForCheckout.mockResolvedValue({
      id: 'c1',
      items: [
        item({ variant: variant({ product: { ...item().variant.product, status: 'DRAFT' } }) }),
      ],
    });
    await expect(service.prepare(USER, { couponCode: null })).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_ACTIVE' },
    });
  });

  it('rejects a variant without inventory (422 INVENTORY_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.findCartForCheckout.mockResolvedValue({
      id: 'c1',
      items: [item({ variant: variant({ inventory: null }) })],
    });
    await expect(service.prepare(USER, { couponCode: null })).rejects.toMatchObject({
      response: { code: 'INVENTORY_NOT_FOUND' },
    });
  });

  it('rejects quantity exceeding available stock (422 INSUFFICIENT_STOCK)', async () => {
    const { service, repo } = makeService();
    repo.findCartForCheckout.mockResolvedValue({
      id: 'c1',
      items: [item({ quantity: 5, variant: variant({ inventory: { availableStock: 2 } }) })],
    });
    await expect(service.prepare(USER, { couponCode: null })).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_STOCK' },
    });
  });

  it('computes totals and returns the primary image on success', async () => {
    const { service, repo } = makeService();
    repo.findCartForCheckout.mockResolvedValue({ id: 'c1', items: [item()] });
    const result = await service.prepare(USER, { couponCode: null });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.unitPrice).toBe(800);
    expect(result.items[0]?.lineTotal).toBe(1600);
    expect(result.items[0]?.image).toEqual({ id: 'img1', url: 'u', sortOrder: 0 });
    expect(result.subtotal).toBe(1600);
    expect(result.shipping).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.grandTotal).toBe(1600);
  });

  it('uses priceOverride when present', async () => {
    const { service, repo } = makeService();
    repo.findCartForCheckout.mockResolvedValue({
      id: 'c1',
      items: [item({ quantity: 3, variant: variant({ priceOverride: 500 }) })],
    });
    const result = await service.prepare(USER, { couponCode: null });
    expect(result.items[0]?.unitPrice).toBe(500);
    expect(result.items[0]?.lineTotal).toBe(1500);
  });

  it('grandTotal equals the sum of line totals across items', async () => {
    const { service, repo } = makeService();
    repo.findCartForCheckout.mockResolvedValue({
      id: 'c1',
      items: [
        item({ id: 'i1', quantity: 2 }),
        item({
          id: 'i2',
          quantity: 1,
          variant: variant({ id: 'v2', sku: 'B', priceOverride: 500 }),
        }),
      ],
    });
    const result = await service.prepare(USER, { couponCode: null });
    expect(result.subtotal).toBe(2100);
    expect(result.grandTotal).toBe(2100);
  });
});
