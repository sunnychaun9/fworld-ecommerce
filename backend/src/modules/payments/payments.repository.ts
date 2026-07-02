import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';

/** Outcome of a guarded payment transition. */
export interface PaymentTransition {
  transitioned: boolean;
  status: PaymentStatus;
}

export interface CreatePaymentData {
  orderId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
}

/**
 * Payments data-access layer. **All Prisma queries live here**; no business logic.
 */
@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Order scoped to its owner, with just the fields payment creation needs. */
  findOrderForPayment(userId: string, orderId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true, paymentStatus: true, grandTotal: true },
    });
  }

  /** The order's active pending payment, if one already exists. */
  findPendingPayment(orderId: string) {
    return this.prisma.payment.findFirst({ where: { orderId, status: 'PENDING' } });
  }

  createPayment(data: CreatePaymentData) {
    return this.prisma.payment.create({
      data: {
        id: newId(),
        orderId: data.orderId,
        provider: 'RAZORPAY',
        providerOrderId: data.providerOrderId,
        amount: data.amount,
        currency: data.currency,
        status: 'PENDING',
      },
    });
  }

  /** A payment by id, scoped to the owning user via the order relation. */
  findPaymentForUser(userId: string, id: string) {
    return this.prisma.payment.findFirst({ where: { id, order: { userId } } });
  }

  /** Payment for verification (ownership + fields needed to check the signature). */
  findPaymentForVerification(userId: string, id: string) {
    return this.prisma.payment.findFirst({
      where: { id, order: { userId } },
      select: { id: true, status: true, providerOrderId: true },
    });
  }

  findPaymentByProviderOrderId(providerOrderId: string) {
    return this.prisma.payment.findFirst({
      where: { providerOrderId },
      select: { id: true, status: true },
    });
  }

  /**
   * Idempotently capture a payment: only a PENDING → PAID transition performs the
   * order-confirm + reservation-release; a re-run is a no-op returning the current
   * status. Returns whether this call performed the transition.
   */
  capturePayment(paymentId: string, providerPaymentId: string): Promise<PaymentTransition> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: { status: 'PAID', providerPaymentId },
      });
      if (updated.count === 0) {
        const current = await tx.payment.findUnique({
          where: { id: paymentId },
          select: { status: true },
        });
        return { transitioned: false, status: current?.status ?? 'PENDING' };
      }
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: { orderId: true },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
      });
      const items = await tx.orderItem.findMany({
        where: { orderId: payment.orderId },
        select: { variantId: true, quantity: true },
      });
      for (const item of items) {
        if (item.variantId) {
          await tx.inventory.updateMany({
            where: { variantId: item.variantId },
            data: { reservedStock: { decrement: item.quantity } },
          });
        }
      }
      return { transitioned: true, status: 'PAID' };
    });
  }

  /**
   * Idempotently fail a payment: only a PENDING → FAILED transition restores
   * inventory (availableStock += qty, reservedStock -= qty). Order status stays
   * PENDING. Returns whether this call performed the transition.
   */
  failPayment(paymentId: string): Promise<PaymentTransition> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      if (updated.count === 0) {
        const current = await tx.payment.findUnique({
          where: { id: paymentId },
          select: { status: true },
        });
        return { transitioned: false, status: current?.status ?? 'PENDING' };
      }
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: { orderId: true },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'FAILED' },
      });
      const items = await tx.orderItem.findMany({
        where: { orderId: payment.orderId },
        select: { variantId: true, quantity: true },
      });
      for (const item of items) {
        if (item.variantId) {
          await tx.inventory.updateMany({
            where: { variantId: item.variantId },
            data: {
              availableStock: { increment: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });
        }
      }
      return { transitioned: true, status: 'FAILED' };
    });
  }
}
