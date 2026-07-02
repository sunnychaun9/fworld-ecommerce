import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import { CartRepository } from './cart.repository';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type CartWithItems = NonNullable<Awaited<ReturnType<CartRepository['findCartWithItems']>>>;

/**
 * Authenticated shopping-cart service. One cart per user; enforces ACTIVE
 * products, inventory existence and available-stock limits, merges duplicate
 * variants, and computes line/subtotal figures on read (never stored). Holds
 * business logic only; every Prisma query is delegated to {@link CartRepository}.
 */
@Injectable()
export class CartService {
  constructor(private readonly repository: CartRepository) {}

  async getCart(userId: string) {
    const cartId = await this.repository.getOrCreateCartId(userId);
    const cart = await this.repository.findCartWithItems(userId);
    if (!cart) {
      return { id: cartId, items: [], subtotal: 0, totalItems: 0 };
    }
    return this.mapCart(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cartId = await this.repository.getOrCreateCartId(userId);

    const variant = await this.repository.findVariantForCart(dto.variantId);
    if (!variant) {
      throw this.unprocessable('VARIANT_NOT_FOUND', 'Variant does not exist');
    }
    if (variant.product.status !== 'ACTIVE') {
      throw this.unprocessable('PRODUCT_NOT_ACTIVE', 'Product is not available');
    }
    if (!variant.inventory) {
      throw this.unprocessable('INVENTORY_NOT_FOUND', 'Variant has no inventory');
    }

    const existing = await this.repository.findCartItem(cartId, dto.variantId);
    const nextQuantity = (existing?.quantity ?? 0) + dto.quantity;
    if (nextQuantity > variant.inventory.availableStock) {
      throw this.unprocessable('INSUFFICIENT_STOCK', 'Requested quantity exceeds available stock');
    }

    if (existing) {
      await this.repository.updateItemQuantity(existing.id, nextQuantity);
    } else {
      await this.repository.addItem(cartId, dto.variantId, dto.quantity);
    }
    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.repository.findCartItemById(itemId);
    if (!item || item.cart.userId !== userId) {
      throw this.notFound();
    }

    if (dto.quantity === 0) {
      await this.repository.deleteItem(itemId);
      return this.getCart(userId);
    }

    if (!item.variant.inventory) {
      throw this.unprocessable('INVENTORY_NOT_FOUND', 'Variant has no inventory');
    }
    if (dto.quantity > item.variant.inventory.availableStock) {
      throw this.unprocessable('INSUFFICIENT_STOCK', 'Requested quantity exceeds available stock');
    }

    await this.repository.updateItemQuantity(itemId, dto.quantity);
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.repository.findCartItemById(itemId);
    if (!item || item.cart.userId !== userId) {
      throw this.notFound();
    }
    await this.repository.deleteItem(itemId);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cartId = await this.repository.getOrCreateCartId(userId);
    await this.repository.clearItems(cartId);
    return this.getCart(userId);
  }

  private mapCart(cart: CartWithItems) {
    const items = cart.items.map((item) => {
      const { variant } = item;
      const product = variant.product;
      const unitPrice = Number(variant.priceOverride ?? product.sellingPrice);
      const lineTotal = unitPrice * item.quantity;
      return {
        id: item.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        variant: {
          id: variant.id,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          priceOverride: variant.priceOverride,
        },
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
          status: product.status,
        },
        inventory: variant.inventory,
        images: product.images,
      };
    });

    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    return { id: cart.id, items, subtotal, totalItems };
  }

  private unprocessable(code: string, message: string): UnprocessableEntityException {
    return new UnprocessableEntityException({ code, message });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Cart item not found' });
  }
}
