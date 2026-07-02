import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentsRepository, PaymentTransition } from './payments.repository';
import { RazorpayService } from './razorpay.service';

export interface VerifyResult {
  paymentId: string;
  status: string;
}

/**
 * Payment verification: validates the Razorpay signature and (idempotently)
 * captures the payment — confirming the order and releasing the reservation.
 * Reused by the webhook flow. Holds business logic only; Prisma stays in the
 * repository. Never modifies inventory more than once for a payment.
 */
@Injectable()
export class PaymentVerificationService {
  constructor(
    private readonly repository: PaymentsRepository,
    private readonly razorpay: RazorpayService,
  ) {}

  async verify(userId: string, dto: VerifyPaymentDto): Promise<VerifyResult> {
    const payment = await this.repository.findPaymentForVerification(userId, dto.paymentId);
    if (!payment) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Payment not found' });
    }

    const signatureValid =
      payment.providerOrderId === dto.razorpayOrderId &&
      this.razorpay.verifyPaymentSignature(
        dto.razorpayOrderId,
        dto.razorpayPaymentId,
        dto.razorpaySignature,
      );
    if (!signatureValid) {
      throw new UnprocessableEntityException({
        code: 'INVALID_PAYMENT_SIGNATURE',
        message: 'Payment signature is invalid',
      });
    }

    if (payment.status === 'PAID') {
      return { paymentId: payment.id, status: 'PAID' };
    }
    if (payment.status === 'FAILED') {
      throw new UnprocessableEntityException({
        code: 'PAYMENT_NOT_PENDING',
        message: 'A failed payment cannot be verified',
      });
    }

    const result = await this.capture(payment.id, dto.razorpayPaymentId);
    return { paymentId: payment.id, status: result.status };
  }

  /** Idempotent capture, shared with the webhook flow. */
  capture(paymentId: string, providerPaymentId: string): Promise<PaymentTransition> {
    return this.repository.capturePayment(paymentId, providerPaymentId);
  }
}
