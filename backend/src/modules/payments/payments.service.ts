import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsRepository } from './payments.repository';
import { RazorpayService } from './razorpay.service';

export interface PaymentOrderResponse {
  paymentId: string;
  razorpayOrderId: string | null;
  amount: number;
  currency: string;
  key: string;
}

/**
 * Payment service (Razorpay foundation). Creates a provider order for a payable
 * order and reuses an existing pending payment instead of duplicating it. Does
 * not touch inventory or order status, capture payments, or verify signatures.
 * Holds business logic only; every Prisma query is delegated to the repository.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly repository: PaymentsRepository,
    private readonly razorpay: RazorpayService,
  ) {}

  async createPaymentOrder(userId: string, dto: CreatePaymentDto): Promise<PaymentOrderResponse> {
    const order = await this.repository.findOrderForPayment(userId, dto.orderId);
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found' });
    }
    if (order.status !== 'PENDING' || order.paymentStatus !== 'PENDING') {
      throw new UnprocessableEntityException({
        code: 'ORDER_NOT_PAYABLE',
        message: 'Order is not payable',
      });
    }

    const existing = await this.repository.findPendingPayment(order.id);
    if (existing) {
      return this.toResponse(
        existing.id,
        existing.providerOrderId,
        existing.amount,
        existing.currency,
      );
    }

    const amountPaise = this.toPaise(order.grandTotal);
    const razorpayOrder = await this.razorpay.createOrder({
      amountPaise,
      currency: 'INR',
      receipt: order.id,
    });
    const payment = await this.repository.createPayment({
      orderId: order.id,
      providerOrderId: razorpayOrder.id,
      amount: Number(order.grandTotal),
      currency: 'INR',
    });

    return this.toResponse(payment.id, payment.providerOrderId, payment.amount, payment.currency);
  }

  async getById(userId: string, id: string) {
    const payment = await this.repository.findPaymentForUser(userId, id);
    if (!payment) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Payment not found' });
    }
    return payment;
  }

  private toResponse(
    paymentId: string,
    razorpayOrderId: string | null,
    amount: { toString(): string } | number,
    currency: string,
  ): PaymentOrderResponse {
    return {
      paymentId,
      razorpayOrderId,
      amount: this.toPaise(amount),
      currency,
      key: this.razorpay.getKeyId(),
    };
  }

  private toPaise(amount: { toString(): string } | number): number {
    return Math.round(Number(amount) * 100);
  }
}
