import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface CreateRazorpayOrderInput {
  amountPaise: number;
  currency: string;
  receipt: string;
}

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';

/**
 * Thin Razorpay REST client (order creation only). Uses the Orders API directly
 * over `fetch` — no SDK dependency. Webhooks/capture/verification are out of
 * scope for this milestone.
 */
@Injectable()
export class RazorpayService {
  constructor(private readonly config: ConfigService) {}

  getKeyId(): string {
    return this.credentials().keyId;
  }

  async createOrder(input: CreateRazorpayOrderInput): Promise<RazorpayOrder> {
    const { keyId, keySecret } = this.credentials();
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch(RAZORPAY_ORDERS_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: input.currency,
        receipt: input.receipt,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException({
        code: 'PAYMENT_PROVIDER_ERROR',
        message: 'Failed to create Razorpay order',
      });
    }

    const body = (await response.json()) as RazorpayOrder;
    return { id: body.id, amount: body.amount, currency: body.currency };
  }

  /** Verify a Razorpay payment signature: HMAC_SHA256(`${orderId}|${paymentId}`, keySecret). */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const { keySecret } = this.credentials();
    const expected = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return this.safeEqual(expected, signature);
  }

  /** Verify a Razorpay webhook signature: HMAC_SHA256(rawBody, webhookSecret). */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const secret = this.credentials().webhookSecret;
    if (!secret) {
      throw new InternalServerErrorException({
        code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
        message: 'Razorpay webhook secret is not configured',
      });
    }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return this.safeEqual(expected, signature);
  }

  private safeEqual(expected: string, provided: string): boolean {
    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(provided);
    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return timingSafeEqual(expectedBuf, providedBuf);
  }

  private credentials(): RazorpayConfig {
    const config = this.config.get<RazorpayConfig>('payments.razorpay');
    if (!config) {
      throw new InternalServerErrorException({
        code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
        message: 'Razorpay is not configured',
      });
    }
    return config;
  }
}
