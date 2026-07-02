import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';

interface CreateShipmentData {
  orderId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  estimatedDelivery: Date | null;
}

/**
 * Shipping data-access layer. **All Prisma queries live here**; the service holds
 * business logic only.
 */
@Injectable()
export class ShippingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.shipment.findUnique({ where: { id } });
  }

  findByOrderId(orderId: string) {
    return this.prisma.shipment.findUnique({ where: { orderId } });
  }

  orderForShipment(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentStatus: true },
    });
  }

  /** Shipment tracking for an order that belongs to the given user. */
  findTrackingForOwner(userId: string, orderId: string) {
    return this.prisma.shipment.findFirst({ where: { orderId, order: { userId } } });
  }

  /** Create the shipment and mark the order SHIPPED atomically. */
  create(data: CreateShipmentData, shippedAt: Date) {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          id: newId(),
          orderId: data.orderId,
          courier: data.courier,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl,
          estimatedDelivery: data.estimatedDelivery,
          shippedAt,
        },
      });
      await tx.order.update({ where: { id: data.orderId }, data: { status: 'SHIPPED' } });
      await tx.orderStatusHistory.create({
        data: { id: newId(), orderId: data.orderId, status: 'SHIPPED', note: 'Shipment created' },
      });
      return shipment;
    });
  }

  update(id: string, data: Prisma.ShipmentUncheckedUpdateInput) {
    return this.prisma.shipment.update({ where: { id }, data });
  }

  /** Set deliveredAt and mark the order DELIVERED atomically. */
  markDelivered(id: string, orderId: string, deliveredAt: Date) {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.update({ where: { id }, data: { deliveredAt } });
      await tx.order.update({ where: { id: orderId }, data: { status: 'DELIVERED' } });
      await tx.orderStatusHistory.create({
        data: { id: newId(), orderId, status: 'DELIVERED', note: 'Shipment delivered' },
      });
      return shipment;
    });
  }
}
