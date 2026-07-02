import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PaymentVerificationService } from './payment-verification.service';
import { PaymentsRepository } from './payments.repository';
import { RazorpayService } from './razorpay.service';

interface RepoMock {
  findPaymentForVerification: ReturnType<typeof vi.fn>;
  capturePayment: ReturnType<typeof vi.fn>;
}
interface RazorpayMock {
  verifyPaymentSignature: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const DTO = {
  paymentId: 'pay-1',
  razorpayOrderId: 'order_1',
  razorpayPaymentId: 'rzp_pay_1',
  razorpaySignature: 'sig',
};

function makeService(): {
  service: PaymentVerificationService;
  repo: RepoMock;
  razorpay: RazorpayMock;
} {
  const repo: RepoMock = {
    findPaymentForVerification: vi
      .fn()
      .mockResolvedValue({ id: 'pay-1', status: 'PENDING', providerOrderId: 'order_1' }),
    capturePayment: vi.fn().mockResolvedValue({ transitioned: true, status: 'PAID' }),
  };
  const razorpay: RazorpayMock = { verifyPaymentSignature: vi.fn().mockReturnValue(true) };
  const service = new PaymentVerificationService(
    repo as unknown as PaymentsRepository,
    razorpay as unknown as RazorpayService,
  );
  return { service, repo, razorpay };
}

describe('PaymentVerificationService', () => {
  it('verifies a valid signature and captures the payment', async () => {
    const { service, repo } = makeService();
    const result = await service.verify(USER, DTO);
    expect(repo.capturePayment).toHaveBeenCalledWith('pay-1', 'rzp_pay_1');
    expect(result).toEqual({ paymentId: 'pay-1', status: 'PAID' });
  });

  it('rejects an invalid signature (422 INVALID_PAYMENT_SIGNATURE)', async () => {
    const { service, repo, razorpay } = makeService();
    razorpay.verifyPaymentSignature.mockReturnValue(false);
    await expect(service.verify(USER, DTO)).rejects.toMatchObject({
      response: { code: 'INVALID_PAYMENT_SIGNATURE' },
    });
    expect(repo.capturePayment).not.toHaveBeenCalled();
  });

  it('rejects when the order id does not match the stored payment (422)', async () => {
    const { service, repo } = makeService();
    repo.findPaymentForVerification.mockResolvedValue({
      id: 'pay-1',
      status: 'PENDING',
      providerOrderId: 'different_order',
    });
    await expect(service.verify(USER, DTO)).rejects.toMatchObject({
      response: { code: 'INVALID_PAYMENT_SIGNATURE' },
    });
  });

  it('returns 404 when the payment is not owned by the user', async () => {
    const { service, repo } = makeService();
    repo.findPaymentForVerification.mockResolvedValue(null);
    await expect(service.verify(USER, DTO)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('is idempotent when already PAID (no re-capture)', async () => {
    const { service, repo } = makeService();
    repo.findPaymentForVerification.mockResolvedValue({
      id: 'pay-1',
      status: 'PAID',
      providerOrderId: 'order_1',
    });
    const result = await service.verify(USER, DTO);
    expect(result).toEqual({ paymentId: 'pay-1', status: 'PAID' });
    expect(repo.capturePayment).not.toHaveBeenCalled();
  });

  it('rejects verifying a FAILED payment (422 PAYMENT_NOT_PENDING)', async () => {
    const { service, repo } = makeService();
    repo.findPaymentForVerification.mockResolvedValue({
      id: 'pay-1',
      status: 'FAILED',
      providerOrderId: 'order_1',
    });
    await expect(service.verify(USER, DTO)).rejects.toMatchObject({
      response: { code: 'PAYMENT_NOT_PENDING' },
    });
    expect(repo.capturePayment).not.toHaveBeenCalled();
  });

  it('handles a concurrent capture (transition already done) without error', async () => {
    const { service, repo } = makeService();
    repo.capturePayment.mockResolvedValue({ transitioned: false, status: 'PAID' });
    const result = await service.verify(USER, DTO);
    expect(result).toEqual({ paymentId: 'pay-1', status: 'PAID' });
  });
});
