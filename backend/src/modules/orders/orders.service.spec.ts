import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { InsufficientStockError, OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

interface RepoMock {
  findCartForOrder: ReturnType<typeof vi.fn>;
  createOrder: ReturnType<typeof vi.fn>;
  findOrders: ReturnType<typeof vi.fn>;
  findOrderById: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const CART = 'cart-1';
const ORDER = 'order-1';

const ADDRESS = {
  fullName: 'Jane Doe',
  phone: '9876543210',
  addressLine1: '1 Road',
  city: 'Mumbai',
  state: 'MH',
  postalCode: '400001',
};

function cartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'i1',
    quantity: 2,
    variant: {
      id: 'v1',
      sku: 'A',
      size: 'M',
      color: 'Black',
      priceOverride: null,
      inventory: { availableStock: 10 },
      product: { name: 'Tee', slug: 'tee', status: 'ACTIVE', sellingPrice: 800 },
      ...(overrides.variant as object),
    },
    ...overrides,
  };
}

function variant(overrides: Record<string, unknown> = {}) {
  return { ...cartItem().variant, ...overrides };
}

function makeService(): { service: OrdersService; repo: RepoMock } {
  const repo: RepoMock = {
    findCartForOrder: vi.fn().mockResolvedValue({ id: CART, items: [cartItem()] }),
    createOrder: vi.fn().mockResolvedValue(ORDER),
    findOrders: vi.fn().mockResolvedValue([[], 0]),
    findOrderById: vi.fn().mockResolvedValue({ id: ORDER, items: [] }),
  };
  return { service: new OrdersService(repo as unknown as OrdersRepository), repo };
}

describe('OrdersService', () => {
  it('creates an order with persisted totals and price snapshots', async () => {
    const { service, repo } = makeService();
    const result = await service.create(USER, { shippingAddress: ADDRESS });
    const [userId, cartId, order, items] = repo.createOrder.mock.calls[0] ?? [];
    expect(userId).toBe(USER);
    expect(cartId).toBe(CART);
    expect(order).toMatchObject({
      subtotal: 1600,
      grandTotal: 1600,
      shipping: 0,
      tax: 0,
      discount: 0,
    });
    expect(items[0]).toMatchObject({
      variantId: 'v1',
      productName: 'Tee',
      variantSku: 'A',
      unitPrice: 800,
      quantity: 2,
      lineTotal: 1600,
    });
    expect(result).toEqual({ id: ORDER, items: [] });
    expect(repo.findOrderById).toHaveBeenCalledWith(USER, ORDER);
  });

  it('rejects an empty/missing cart (422 EMPTY_CART)', async () => {
    const { service, repo } = makeService();
    repo.findCartForOrder.mockResolvedValue(null);
    await expect(service.create(USER, { shippingAddress: ADDRESS })).rejects.toMatchObject({
      response: { code: 'EMPTY_CART' },
    });
    repo.findCartForOrder.mockResolvedValue({ id: CART, items: [] });
    await expect(service.create(USER, { shippingAddress: ADDRESS })).rejects.toMatchObject({
      response: { code: 'EMPTY_CART' },
    });
  });

  it('rejects an inactive product (422 PRODUCT_NOT_ACTIVE)', async () => {
    const { service, repo } = makeService();
    repo.findCartForOrder.mockResolvedValue({
      id: CART,
      items: [
        cartItem({
          variant: variant({ product: { ...cartItem().variant.product, status: 'DRAFT' } }),
        }),
      ],
    });
    await expect(service.create(USER, { shippingAddress: ADDRESS })).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_ACTIVE' },
    });
    expect(repo.createOrder).not.toHaveBeenCalled();
  });

  it('rejects a variant without inventory (422 INVENTORY_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.findCartForOrder.mockResolvedValue({
      id: CART,
      items: [cartItem({ variant: variant({ inventory: null }) })],
    });
    await expect(service.create(USER, { shippingAddress: ADDRESS })).rejects.toMatchObject({
      response: { code: 'INVENTORY_NOT_FOUND' },
    });
  });

  it('rejects insufficient stock before the transaction (422 INSUFFICIENT_STOCK)', async () => {
    const { service, repo } = makeService();
    repo.findCartForOrder.mockResolvedValue({
      id: CART,
      items: [cartItem({ quantity: 5, variant: variant({ inventory: { availableStock: 2 } }) })],
    });
    await expect(service.create(USER, { shippingAddress: ADDRESS })).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_STOCK' },
    });
    expect(repo.createOrder).not.toHaveBeenCalled();
  });

  it('maps a transaction stock race to 422 INSUFFICIENT_STOCK (rollback)', async () => {
    const { service, repo } = makeService();
    repo.createOrder.mockRejectedValue(new InsufficientStockError('v1'));
    await expect(service.create(USER, { shippingAddress: ADDRESS })).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_STOCK' },
    });
  });

  it('uses priceOverride for the snapshot when present', async () => {
    const { service, repo } = makeService();
    repo.findCartForOrder.mockResolvedValue({
      id: CART,
      items: [cartItem({ quantity: 3, variant: variant({ priceOverride: 500 }) })],
    });
    await service.create(USER, { shippingAddress: ADDRESS });
    const items = repo.createOrder.mock.calls[0]?.[3];
    expect(items[0]).toMatchObject({ unitPrice: 500, lineTotal: 1500 });
  });

  it('lists the user orders with pagination', async () => {
    const { service, repo } = makeService();
    repo.findOrders.mockResolvedValue([[{ id: ORDER }], 1]);
    const result = await service.list(USER, { page: 1, limit: 20 });
    expect(repo.findOrders).toHaveBeenCalledWith(USER, 0, 20);
    expect(result.pageInfo.total).toBe(1);
  });

  it('returns 404 for an order not owned by the user', async () => {
    const { service, repo } = makeService();
    repo.findOrderById.mockResolvedValue(null);
    await expect(service.getById(USER, ORDER)).rejects.toBeInstanceOf(NotFoundException);
  });
});
