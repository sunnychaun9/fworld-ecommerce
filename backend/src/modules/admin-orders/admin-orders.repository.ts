import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';

/**
 * Admin order data-access layer. **All Prisma queries live here**; the service
 * holds business logic only.
 */
@Injectable()
export class AdminOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(where: Prisma.OrderWhereInput, skip: number, take: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { id: true, email: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
        shipment: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  /** Transition status and append a history row atomically. */
  updateStatus(id: string, status: OrderStatus, note: string | null) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({ where: { id }, data: { status } });
      await tx.orderStatusHistory.create({
        data: { id: newId(), orderId: id, status, note },
      });
      return order;
    });
  }
}
