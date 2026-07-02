import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

interface RepoMock {
  getOrCreateCartId: ReturnType<typeof vi.fn>;
  findCartWithItems: ReturnType<typeof vi.fn>;
  findVariantForCart: ReturnType<typeof vi.fn>;
  findCartItem: ReturnType<typeof vi.fn>;
  findCartItemById: ReturnType<typeof vi.fn>;
  addItem: ReturnType<typeof vi.fn>;
  updateItemQuantity: ReturnType<typeof vi.fn>;
  deleteItem: ReturnType<typeof vi.fn>;
  clearItems: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const CART = 'cart-1';
const VID = '01920000-0000-7000-8000-0000000000f1';
const ITEM = 'item-1';

function emptyCart() {
  return { id: CART, items: [] };
}

function activeVariant(overrides: Record<string, unknown> = {}) {
  return {
    id: VID,
    priceOverride: null,
    product: { status: 'ACTIVE' },
    inventory: { availableStock: 10 },
    ...overrides,
  };
}

function makeService(): { service: CartService; repo: RepoMock } {
  const repo: RepoMock = {
    getOrCreateCartId: vi.fn().mockResolvedValue(CART),
    findCartWithItems: vi.fn().mockResolvedValue(emptyCart()),
    findVariantForCart: vi.fn().mockResolvedValue(activeVariant()),
    findCartItem: vi.fn().mockResolvedValue(null),
    findCartItemById: vi.fn(),
    addItem: vi.fn().mockResolvedValue({ id: ITEM }),
    updateItemQuantity: vi.fn().mockResolvedValue({ id: ITEM }),
    deleteItem: vi.fn(),
    clearItems: vi.fn(),
  };
  return { service: new CartService(repo as unknown as CartRepository), repo };
}

describe('CartService', () => {
  it('creates (or reuses) the cart on read', async () => {
    const { service, repo } = makeService();
    const cart = await service.getCart(USER);
    expect(repo.getOrCreateCartId).toHaveBeenCalledWith(USER);
    expect(cart).toEqual({ id: CART, items: [], subtotal: 0, totalItems: 0 });
  });

  it('adds a new item', async () => {
    const { service, repo } = makeService();
    await service.addItem(USER, { variantId: VID, quantity: 2 });
    expect(repo.addItem).toHaveBeenCalledWith(CART, VID, 2);
  });

  it('merges quantity when the variant is already in the cart', async () => {
    const { service, repo } = makeService();
    repo.findCartItem.mockResolvedValue({ id: ITEM, quantity: 2 });
    await service.addItem(USER, { variantId: VID, quantity: 3 });
    expect(repo.updateItemQuantity).toHaveBeenCalledWith(ITEM, 5);
    expect(repo.addItem).not.toHaveBeenCalled();
  });

  it('rejects a missing variant (422 VARIANT_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.findVariantForCart.mockResolvedValue(null);
    await expect(service.addItem(USER, { variantId: VID, quantity: 1 })).rejects.toMatchObject({
      response: { code: 'VARIANT_NOT_FOUND' },
    });
  });

  it('rejects an inactive product (422 PRODUCT_NOT_ACTIVE)', async () => {
    const { service, repo } = makeService();
    repo.findVariantForCart.mockResolvedValue(activeVariant({ product: { status: 'DRAFT' } }));
    await expect(service.addItem(USER, { variantId: VID, quantity: 1 })).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_ACTIVE' },
    });
  });

  it('rejects a variant without inventory (422 INVENTORY_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.findVariantForCart.mockResolvedValue(activeVariant({ inventory: null }));
    await expect(service.addItem(USER, { variantId: VID, quantity: 1 })).rejects.toMatchObject({
      response: { code: 'INVENTORY_NOT_FOUND' },
    });
  });

  it('rejects quantity exceeding available stock (422 INSUFFICIENT_STOCK)', async () => {
    const { service, repo } = makeService();
    repo.findVariantForCart.mockResolvedValue(activeVariant({ inventory: { availableStock: 2 } }));
    await expect(service.addItem(USER, { variantId: VID, quantity: 5 })).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_STOCK' },
    });
  });

  it('updates an item quantity for the owner', async () => {
    const { service, repo } = makeService();
    repo.findCartItemById.mockResolvedValue({
      id: ITEM,
      cart: { userId: USER },
      variant: { inventory: { availableStock: 10 } },
    });
    await service.updateItem(USER, ITEM, { quantity: 3 });
    expect(repo.updateItemQuantity).toHaveBeenCalledWith(ITEM, 3);
  });

  it('removes the item when quantity is 0', async () => {
    const { service, repo } = makeService();
    repo.findCartItemById.mockResolvedValue({
      id: ITEM,
      cart: { userId: USER },
      variant: { inventory: { availableStock: 10 } },
    });
    await service.updateItem(USER, ITEM, { quantity: 0 });
    expect(repo.deleteItem).toHaveBeenCalledWith(ITEM);
    expect(repo.updateItemQuantity).not.toHaveBeenCalled();
  });

  it('rejects updating an item owned by another user (404)', async () => {
    const { service, repo } = makeService();
    repo.findCartItemById.mockResolvedValue({
      id: ITEM,
      cart: { userId: 'someone-else' },
      variant: { inventory: { availableStock: 10 } },
    });
    await expect(service.updateItem(USER, ITEM, { quantity: 1 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes an item', async () => {
    const { service, repo } = makeService();
    repo.findCartItemById.mockResolvedValue({ id: ITEM, cart: { userId: USER }, variant: {} });
    await service.removeItem(USER, ITEM);
    expect(repo.deleteItem).toHaveBeenCalledWith(ITEM);
  });

  it('clears the cart but keeps the cart record', async () => {
    const { service, repo } = makeService();
    await service.clearCart(USER);
    expect(repo.clearItems).toHaveBeenCalledWith(CART);
  });

  it('computes lineTotal, subtotal and totalItems (price falls back to sellingPrice)', async () => {
    const { service, repo } = makeService();
    repo.findCartWithItems.mockResolvedValue({
      id: CART,
      items: [
        {
          id: 'i1',
          quantity: 2,
          variant: {
            id: 'v1',
            sku: 'A',
            size: 'M',
            color: 'Black',
            colorHex: null,
            priceOverride: null,
            inventory: { availableStock: 5 },
            product: {
              id: 'p1',
              name: 'Tee',
              slug: 'tee',
              mrp: 1000,
              sellingPrice: 800,
              status: 'ACTIVE',
              images: [],
            },
          },
        },
        {
          id: 'i2',
          quantity: 1,
          variant: {
            id: 'v2',
            sku: 'B',
            size: 'L',
            color: 'Blue',
            colorHex: null,
            priceOverride: 500,
            inventory: { availableStock: 5 },
            product: {
              id: 'p2',
              name: 'Jeans',
              slug: 'jeans',
              mrp: 900,
              sellingPrice: 700,
              status: 'ACTIVE',
              images: [],
            },
          },
        },
      ],
    });
    const cart = await service.getCart(USER);
    expect(cart.items[0]?.lineTotal).toBe(1600);
    expect(cart.items[1]?.lineTotal).toBe(500);
    expect(cart.subtotal).toBe(2100);
    expect(cart.totalItems).toBe(3);
  });
});
