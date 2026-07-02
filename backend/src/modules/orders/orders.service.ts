import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { InsufficientStockError, OrderItemInput, OrdersRepository } from './orders.repository';

/**
 * Order service. Creates an order from the authenticated user's validated cart
 * inside a transaction (reserve inventory, clear cart), persisting price/line
 * snapshots so later catalog changes never alter historical orders. No payment
 * gateway. Holds business logic only; every Prisma query is delegated to
 * {@link OrdersRepository}.
 */
@Injectable()
export class OrdersService {
  constructor(private readonly repository: OrdersRepository) {}

  async create(userId: string, dto: CreateOrderDto) {
    const cart = await this.repository.findCartForOrder(userId);
    if (!cart || cart.items.length === 0) {
      throw this.unprocessable('EMPTY_CART', 'Cart is empty');
    }

    const items: OrderItemInput[] = cart.items.map((item) => {
      const { variant } = item;
      const product = variant.product;
      if (product.status !== 'ACTIVE') {
        throw this.unprocessable(
          'PRODUCT_NOT_ACTIVE',
          `Product "${product.name}" is not available`,
        );
      }
      if (!variant.inventory) {
        throw this.unprocessable(
          'INVENTORY_NOT_FOUND',
          `Variant "${variant.sku}" has no inventory`,
        );
      }
      if (item.quantity > variant.inventory.availableStock) {
        throw this.unprocessable('INSUFFICIENT_STOCK', `Insufficient stock for "${variant.sku}"`);
      }
      const unitPrice = Number(variant.priceOverride ?? product.sellingPrice);
      return {
        variantId: variant.id,
        productName: product.name,
        productSlug: product.slug,
        variantSku: variant.sku,
        variantSize: variant.size,
        variantColor: variant.color,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
    const shipping = 0;
    const tax = 0;
    const discount = 0;
    const grandTotal = subtotal + shipping + tax - discount;

    const address = dto.shippingAddress;
    const shippingAddress: Prisma.InputJsonObject = {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? null,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    };

    let orderId: string;
    try {
      orderId = await this.repository.createOrder(
        userId,
        cart.id,
        { shippingAddress, subtotal, shipping, tax, discount, grandTotal },
        items,
      );
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        throw this.unprocessable('INSUFFICIENT_STOCK', 'Stock changed; please review your cart');
      }
      throw error;
    }

    return this.getById(userId, orderId);
  }

  async list(userId: string, query: ListOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.repository.findOrders(userId, (page - 1) * limit, limit);
    return {
      items,
      pageInfo: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    };
  }

  async getById(userId: string, id: string) {
    const order = await this.repository.findOrderById(userId, id);
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found' });
    }
    return order;
  }

  private unprocessable(code: string, message: string): UnprocessableEntityException {
    return new UnprocessableEntityException({ code, message });
  }
}
