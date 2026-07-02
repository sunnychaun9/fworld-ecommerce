import { BadRequestException, Injectable } from '@nestjs/common';

import { PaymentVerificationService } from './payment-verification.service';
import { PaymentsRepository } from './payments.repository';
import { RazorpayService } from './razorpay.service';

/** Minimal shape of the Razorpay webhook events we handle. */
export interface RazorpayWebhookEvent {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
}

/**
 * Razorpay webhook processing. Verifies the webhook signature, then routes
 * `payment.captured` (reuses the idempotent capture flow) and `payment.failed`
 * (idempotent inventory restore). Duplicate deliveries are safe no-ops.
 */
@Injectable()
export class WebhookService {
  constructor(
    private readonly razorpay: RazorpayService,
    private readonly repository: PaymentsRepository,
    private readonly verification: PaymentVerificationService,
  ) {}

  async handle(
    rawBody: string | Buffer,
    signature: string | undefined,
    event: RazorpayWebhookEvent,
  ): Promise<{ received: boolean }> {
    if (!signature || !this.razorpay.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException({
        code: 'INVALID_WEBHOOK_SIGNATURE',
        message: 'Webhook signature is invalid',
      });
    }

    const entity = event.payload?.payment?.entity;
    if (!entity?.order_id) {
      return { received: true };
    }

    const payment = await this.repository.findPaymentByProviderOrderId(entity.order_id);
    if (!payment) {
      return { received: true };
    }

    if (event.event === 'payment.captured') {
      await this.verification.capture(payment.id, entity.id ?? '');
    } else if (event.event === 'payment.failed') {
      await this.repository.failPayment(payment.id);
    }

    return { received: true };
  }
}
