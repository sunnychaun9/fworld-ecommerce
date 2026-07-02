import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';

/** Thrown inside the order transaction when a guarded stock decrement fails. */
export class InsufficientStockError extends Error {
  constructor(public readonly variantId: string) {
    super('INSUFFICIENT_STOCK');
    this.name = 'InsufficientStockError';
  }
}

/** Snapshot of a line item persisted on the order (immune to later catalog edits). */
export interface OrderItemInput {
  variantId: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  variantSize: string | null;
  variantColor: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderData {
  shippingAddress: Prisma.InputJsonValue;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  grandTotal: number;
}

/**
 * Orders data-access layer. **All Prisma queries live here**, including the
 * order-creation transaction (create order + items, guarded inventory reserve,
 * clear cart). The service holds business logic only.
 */
@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** User's cart with everything order creation needs (single eager query). */
  findCartForOrder(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            quantity: true,
            variant: {
              select: {
                id: true,
                sku: true,
                size: true,
                color: true,
                priceOverride: true,
                inventory: { select: { availableStock: true } },
                product: { select: { name: true, slug: true, status: true, sellingPrice: true } },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create the order atomically: order + items, reserve inventory with a guarded
   * decrement (rolls back with {@link InsufficientStockError} if stock changed),
   * then clear the cart. Returns the new order id.
   */
  createOrder(
    userId: string,
    cartId: string,
    order: OrderData,
    items: OrderItemInput[],
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const orderId = newId();
      await tx.order.create({
        data: {
          id: orderId,
          userId,
          shippingAddress: order.shippingAddress,
          subtotal: order.subtotal,
          shipping: order.shipping,
          tax: order.tax,
          discount: order.discount,
          grandTotal: order.grandTotal,
        },
      });
      await tx.orderItem.createMany({
        data: items.map((item) => ({
          id: newId(),
          orderId,
          variantId: item.variantId,
          productName: item.productName,
          productSlug: item.productSlug,
          variantSku: item.variantSku,
          variantSize: item.variantSize,
          variantColor: item.variantColor,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
      });
      for (const item of items) {
        const result = await tx.inventory.updateMany({
          where: { variantId: item.variantId, availableStock: { gte: item.quantity } },
          data: {
            availableStock: { decrement: item.quantity },
            reservedStock: { increment: item.quantity },
          },
        });
        if (result.count !== 1) {
          throw new InsufficientStockError(item.variantId);
        }
      }
      await tx.cartItem.deleteMany({ where: { cartId } });
      return orderId;
    });
  }

  findOrders(userId: string, skip: number, take: number) {
    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { items: true },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
  }

  findOrderById(userId: string, id: string) {
    return this.prisma.order.findFirst({ where: { id, userId }, include: { items: true } });
  }
}
