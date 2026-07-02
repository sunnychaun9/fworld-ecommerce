import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShippingRepository } from './shipping.repository';

const SHIPPABLE_STATUSES = ['CONFIRMED', 'PROCESSING'];

/**
 * Shipping service: one shipment per order, unique tracking number, and
 * automatic order-status side effects (create → SHIPPED, deliver → DELIVERED).
 * Holds business logic only; every Prisma query is delegated to the repository.
 */
@Injectable()
export class ShippingService {
  constructor(private readonly repository: ShippingRepository) {}

  async create(dto: CreateShipmentDto) {
    const order = await this.repository.orderForShipment(dto.orderId);
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found' });
    }
    if (await this.repository.findByOrderId(dto.orderId)) {
      throw new ConflictException({
        code: 'SHIPMENT_EXISTS',
        message: 'This order already has a shipment',
      });
    }
    if (!SHIPPABLE_STATUSES.includes(order.status)) {
      throw new UnprocessableEntityException({
        code: 'ORDER_NOT_CONFIRMED',
        message: 'Only a confirmed order can be shipped',
      });
    }
    if (order.paymentStatus !== 'PAID') {
      throw new UnprocessableEntityException({
        code: 'PAYMENT_NOT_PAID',
        message: 'Order payment must be PAID before it can be shipped',
      });
    }

    try {
      return await this.repository.create(
        {
          orderId: dto.orderId,
          courier: dto.courier,
          trackingNumber: dto.trackingNumber,
          trackingUrl: dto.trackingUrl ?? null,
          estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
        },
        new Date(),
      );
    } catch (error) {
      throw this.mapTrackingConflict(error);
    }
  }

  async update(id: string, dto: UpdateShipmentDto) {
    const shipment = await this.getShipment(id);

    let updated = shipment;
    const fields: Record<string, unknown> = {};
    if (dto.courier !== undefined) fields.courier = dto.courier;
    if (dto.trackingNumber !== undefined) fields.trackingNumber = dto.trackingNumber;
    if (dto.trackingUrl !== undefined) fields.trackingUrl = dto.trackingUrl;
    if (dto.estimatedDelivery !== undefined) {
      fields.estimatedDelivery = new Date(dto.estimatedDelivery);
    }
    if (Object.keys(fields).length > 0) {
      try {
        updated = await this.repository.update(id, fields);
      } catch (error) {
        throw this.mapTrackingConflict(error);
      }
    }

    if (dto.delivered === true) {
      updated = await this.repository.markDelivered(id, shipment.orderId, new Date());
    }
    return updated;
  }

  async getById(id: string) {
    return this.getShipment(id);
  }

  async tracking(userId: string, orderId: string) {
    const shipment = await this.repository.findTrackingForOwner(userId, orderId);
    if (!shipment) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'No shipment found for this order',
      });
    }
    return {
      courier: shipment.courier,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      estimatedDelivery: shipment.estimatedDelivery,
      shippedAt: shipment.shippedAt,
      deliveredAt: shipment.deliveredAt,
    };
  }

  private async getShipment(id: string) {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Shipment not found' });
    }
    return shipment;
  }

  private mapTrackingConflict(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException({
        code: 'TRACKING_NUMBER_TAKEN',
        message: 'Tracking number is already in use',
      });
    }
    return error;
  }
}
