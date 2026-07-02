import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';

interface RepoMock {
  findOrderForPayment: ReturnType<typeof vi.fn>;
  findPendingPayment: ReturnType<typeof vi.fn>;
  createPayment: ReturnType<typeof vi.fn>;
  findPaymentForUser: ReturnType<typeof vi.fn>;
}
interface RazorpayMock {
  createOrder: ReturnType<typeof vi.fn>;
  getKeyId: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const ORDER = 'order-1';

function makeService(): { service: PaymentsService; repo: RepoMock; razorpay: RazorpayMock } {
  const repo: RepoMock = {
    findOrderForPayment: vi.fn().mockResolvedValue({
      id: ORDER,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      grandTotal: 1600,
    }),
    findPendingPayment: vi.fn().mockResolvedValue(null),
    createPayment: vi.fn().mockResolvedValue({
      id: 'pay-1',
      providerOrderId: 'rzp_new',
      amount: 1600,
      currency: 'INR',
    }),
    findPaymentForUser: vi.fn(),
  };
  const razorpay: RazorpayMock = {
    createOrder: vi.fn().mockResolvedValue({ id: 'rzp_new', amount: 160000, currency: 'INR' }),
    getKeyId: vi.fn().mockReturnValue('rzp_key'),
  };
  const service = new PaymentsService(
    repo as unknown as PaymentsRepository,
    razorpay as unknown as RazorpayService,
  );
  return { service, repo, razorpay };
}

describe('PaymentsService', () => {
  it('creates a Razorpay order and payment for a payable order', async () => {
    const { service, repo, razorpay } = makeService();
    const result = await service.createPaymentOrder(USER, { orderId: ORDER });
    expect(razorpay.createOrder).toHaveBeenCalledWith({
      amountPaise: 160000,
      currency: 'INR',
      receipt: ORDER,
    });
    expect(repo.createPayment).toHaveBeenCalledWith({
      orderId: ORDER,
      providerOrderId: 'rzp_new',
      amount: 1600,
      currency: 'INR',
    });
    expect(result).toEqual({
      paymentId: 'pay-1',
      razorpayOrderId: 'rzp_new',
      amount: 160000,
      currency: 'INR',
      key: 'rzp_key',
    });
  });

  it('reuses an existing pending payment instead of creating a new one', async () => {
    const { service, repo, razorpay } = makeService();
    repo.findPendingPayment.mockResolvedValue({
      id: 'pay-existing',
      providerOrderId: 'rzp_old',
      amount: 1600,
      currency: 'INR',
    });
    const result = await service.createPaymentOrder(USER, { orderId: ORDER });
    expect(razorpay.createOrder).not.toHaveBeenCalled();
    expect(repo.createPayment).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      paymentId: 'pay-existing',
      razorpayOrderId: 'rzp_old',
      amount: 160000,
    });
  });

  it('rejects an order not owned by the user (404)', async () => {
    const { service, repo } = makeService();
    repo.findOrderForPayment.mockResolvedValue(null);
    await expect(service.createPaymentOrder(USER, { orderId: ORDER })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects an order that is not payable (422 ORDER_NOT_PAYABLE)', async () => {
    const { service, repo } = makeService();
    repo.findOrderForPayment.mockResolvedValue({
      id: ORDER,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      grandTotal: 1600,
    });
    await expect(service.createPaymentOrder(USER, { orderId: ORDER })).rejects.toMatchObject({
      response: { code: 'ORDER_NOT_PAYABLE' },
    });

    repo.findOrderForPayment.mockResolvedValue({
      id: ORDER,
      status: 'PENDING',
      paymentStatus: 'PAID',
      grandTotal: 1600,
    });
    await expect(service.createPaymentOrder(USER, { orderId: ORDER })).rejects.toMatchObject({
      response: { code: 'ORDER_NOT_PAYABLE' },
    });
  });

  it('returns 404 for a payment not owned by the user', async () => {
    const { service, repo } = makeService();
    repo.findPaymentForUser.mockResolvedValue(null);
    await expect(service.getById(USER, 'pay-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a payment owned by the user', async () => {
    const { service, repo } = makeService();
    repo.findPaymentForUser.mockResolvedValue({ id: 'pay-1', orderId: ORDER });
    await expect(service.getById(USER, 'pay-1')).resolves.toMatchObject({ id: 'pay-1' });
  });
});
