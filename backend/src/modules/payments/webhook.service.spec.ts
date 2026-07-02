import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PaymentVerificationService } from './payment-verification.service';
import { PaymentsRepository } from './payments.repository';
import { RazorpayService } from './razorpay.service';
import { WebhookService } from './webhook.service';

interface RazorpayMock {
  verifyWebhookSignature: ReturnType<typeof vi.fn>;
}
interface RepoMock {
  findPaymentByProviderOrderId: ReturnType<typeof vi.fn>;
  failPayment: ReturnType<typeof vi.fn>;
}
interface VerificationMock {
  capture: ReturnType<typeof vi.fn>;
}

function captured(orderId = 'order_1') {
  return {
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'rzp_1', order_id: orderId } } },
  };
}
function failed(orderId = 'order_1') {
  return {
    event: 'payment.failed',
    payload: { payment: { entity: { id: 'rzp_1', order_id: orderId } } },
  };
}

function makeService(): {
  service: WebhookService;
  razorpay: RazorpayMock;
  repo: RepoMock;
  verification: VerificationMock;
} {
  const razorpay: RazorpayMock = { verifyWebhookSignature: vi.fn().mockReturnValue(true) };
  const repo: RepoMock = {
    findPaymentByProviderOrderId: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'PENDING' }),
    failPayment: vi.fn().mockResolvedValue({ transitioned: true, status: 'FAILED' }),
  };
  const verification: VerificationMock = {
    capture: vi.fn().mockResolvedValue({ transitioned: true, status: 'PAID' }),
  };
  const service = new WebhookService(
    razorpay as unknown as RazorpayService,
    repo as unknown as PaymentsRepository,
    verification as unknown as PaymentVerificationService,
  );
  return { service, razorpay, repo, verification };
}

describe('WebhookService', () => {
  it('rejects a missing or invalid signature', async () => {
    const { service, razorpay } = makeService();
    await expect(service.handle('{}', undefined, captured())).rejects.toBeInstanceOf(
      BadRequestException,
    );
    razorpay.verifyWebhookSignature.mockReturnValue(false);
    await expect(service.handle('{}', 'bad', captured())).rejects.toMatchObject({
      response: { code: 'INVALID_WEBHOOK_SIGNATURE' },
    });
  });

  it('captures on payment.captured', async () => {
    const { service, verification } = makeService();
    const result = await service.handle('{}', 'sig', captured());
    expect(verification.capture).toHaveBeenCalledWith('pay-1', 'rzp_1');
    expect(result).toEqual({ received: true });
  });

  it('fails and restores on payment.failed', async () => {
    const { service, repo } = makeService();
    await service.handle('{}', 'sig', failed());
    expect(repo.failPayment).toHaveBeenCalledWith('pay-1');
  });

  it('ignores an event with no matching payment', async () => {
    const { service, repo, verification } = makeService();
    repo.findPaymentByProviderOrderId.mockResolvedValue(null);
    const result = await service.handle('{}', 'sig', captured());
    expect(verification.capture).not.toHaveBeenCalled();
    expect(result).toEqual({ received: true });
  });

  it('treats a duplicate captured delivery as a safe no-op', async () => {
    const { service, verification } = makeService();
    verification.capture.mockResolvedValue({ transitioned: false, status: 'PAID' });
    const result = await service.handle('{}', 'sig', captured());
    expect(result).toEqual({ received: true });
  });

  it('ignores unhandled event types', async () => {
    const { service, verification, repo } = makeService();
    const result = await service.handle('{}', 'sig', {
      event: 'payment.authorized',
      payload: { payment: { entity: { id: 'x', order_id: 'order_1' } } },
    });
    expect(verification.capture).not.toHaveBeenCalled();
    expect(repo.failPayment).not.toHaveBeenCalled();
    expect(result).toEqual({ received: true });
  });
});
