import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { AdminOrdersRepository } from './admin-orders.repository';
import { ListAdminOrdersDto } from './dto/list-admin-orders.dto';
import { OrderStatusValue, UpdateOrderStatusDto } from './dto/update-order-status.dto';

/** Allowed forward/cancel transitions; DELIVERED, CANCELLED and COMPLETED are terminal. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  COMPLETED: [],
};

/**
 * Admin order management: listing, detail, and guarded status transitions with a
 * stored status history. Holds business logic only; every Prisma query is
 * delegated to {@link AdminOrdersRepository}.
 */
@Injectable()
export class AdminOrdersService {
  constructor(private readonly repository: AdminOrdersRepository) {}

  async list(query: ListAdminOrdersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { items, total } = await this.repository.list(
      query.status ? { status: query.status } : {},
      (page - 1) * pageSize,
      pageSize,
    );
    return { items, total, page, pageSize };
  }

  async getById(id: string) {
    return this.getOrder(id);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.getOrder(id);
    const target = dto.status as OrderStatus;

    if (!TRANSITIONS[order.status].includes(target)) {
      throw new UnprocessableEntityException({
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot change order status from ${order.status} to ${target}`,
      });
    }
    if (target === 'SHIPPED' && order.paymentStatus !== 'PAID') {
      throw new UnprocessableEntityException({
        code: 'PAYMENT_NOT_PAID',
        message: 'Order payment must be PAID before it can be shipped',
      });
    }

    return this.repository.updateStatus(id, target, dto.note ?? null);
  }

  /** Transitions the target state may still enter — helper for other admin flows. */
  canTransition(from: OrderStatusValue, to: OrderStatusValue): boolean {
    return TRANSITIONS[from as OrderStatus].includes(to as OrderStatus);
  }

  private async getOrder(id: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found' });
    }
    return order;
  }
}
