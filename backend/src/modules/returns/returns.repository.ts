import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 * Returns data-access layer. **All Prisma queries live here**; the service holds
 * business logic only. Order/order-item context is read via the existing
 * catalog/order relations (Return itself uses scalar foreign keys).
 */
@Injectable()
export class ReturnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Order-item plus its owning order's status and delivery timestamp. */
  findOrderItemContext(orderItemId: string) {
    return this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: {
        id: true,
        orderId: true,
        lineTotal: true,
        order: {
          select: {
            userId: true,
            status: true,
            updatedAt: true,
            shipment: { select: { deliveredAt: true } },
          },
        },
      },
    });
  }

  findByOrderItemId(orderItemId: string) {
    return this.prisma.return.findUnique({ where: { orderItemId } });
  }

  create(data: Prisma.ReturnUncheckedCreateInput) {
    return this.prisma.return.create({ data });
  }

  findManyByUser(userId: string) {
    return this.prisma.return.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  findByIdForUser(userId: string, id: string) {
    return this.prisma.return.findFirst({ where: { id, userId } });
  }

  findById(id: string) {
    return this.prisma.return.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.ReturnUncheckedUpdateInput) {
    return this.prisma.return.update({ where: { id }, data });
  }
}
