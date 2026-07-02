import { Injectable } from '@nestjs/common';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';

/**
 * Cart data-access layer. **All Prisma queries for the cart live here**; the
 * service holds business logic only.
 */
@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Return the user's cart id, creating the (single) cart on first use. */
  async getOrCreateCartId(userId: string): Promise<string> {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    const created = await this.prisma.cart.create({
      data: { id: newId(), userId },
      select: { id: true },
    });
    return created.id;
  }

  /** Full cart with items, variant, product, images and inventory (single query). */
  findCartWithItems(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            variant: {
              include: {
                inventory: { select: { availableStock: true } },
                product: {
                  include: {
                    images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /** Variant with just what add/update need: price, product status, stock. */
  findVariantForCart(variantId: string) {
    return this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        priceOverride: true,
        product: { select: { status: true } },
        inventory: { select: { availableStock: true } },
      },
    });
  }

  findCartItem(cartId: string, variantId: string) {
    return this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
      select: { id: true, quantity: true },
    });
  }

  findCartItemById(id: string) {
    return this.prisma.cartItem.findUnique({
      where: { id },
      select: {
        id: true,
        cart: { select: { userId: true } },
        variant: { select: { inventory: { select: { availableStock: true } } } },
      },
    });
  }

  addItem(cartId: string, variantId: string, quantity: number) {
    return this.prisma.cartItem.create({
      data: { id: newId(), cartId, variantId, quantity },
    });
  }

  updateItemQuantity(id: string, quantity: number) {
    return this.prisma.cartItem.update({ where: { id }, data: { quantity } });
  }

  async deleteItem(id: string): Promise<void> {
    await this.prisma.cartItem.delete({ where: { id } });
  }

  async clearItems(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
