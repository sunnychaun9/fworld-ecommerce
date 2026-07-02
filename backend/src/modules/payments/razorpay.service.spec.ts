import { createHmac } from 'node:crypto';

import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { RazorpayService } from './razorpay.service';

const KEY_SECRET = 'test_secret';
const WEBHOOK_SECRET = 'whsec_test';

function makeService(
  config: Record<string, unknown> = {
    keyId: 'test_key',
    keySecret: KEY_SECRET,
    webhookSecret: WEBHOOK_SECRET,
  },
): RazorpayService {
  const configService = {
    get: vi.fn().mockReturnValue(config),
  } as unknown as ConfigService;
  return new RazorpayService(configService);
}

function paymentSignature(orderId: string, paymentId: string): string {
  return createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
}

describe('RazorpayService signatures', () => {
  it('accepts a valid payment signature', () => {
    const service = makeService();
    const sig = paymentSignature('order_1', 'pay_1');
    expect(service.verifyPaymentSignature('order_1', 'pay_1', sig)).toBe(true);
  });

  it('rejects an invalid payment signature', () => {
    const service = makeService();
    expect(service.verifyPaymentSignature('order_1', 'pay_1', 'deadbeef')).toBe(false);
  });

  it('accepts a valid webhook signature', () => {
    const service = makeService();
    const raw = JSON.stringify({ event: 'payment.captured' });
    const sig = createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
    expect(service.verifyWebhookSignature(raw, sig)).toBe(true);
  });

  it('rejects an invalid webhook signature', () => {
    const service = makeService();
    expect(service.verifyWebhookSignature('{}', 'nope')).toBe(false);
  });

  it('exposes the public key id', () => {
    const service = makeService();
    expect(service.getKeyId()).toBe('test_key');
  });
});
