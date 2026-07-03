'use client';

import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { appConfig } from '@/config/app';
import { queryKeys } from '@/constants/query-keys';
import { useCurrentUser } from '@/features/auth/use-auth';
import { loadRazorpay } from '@/lib/razorpay';
import { ApiError } from '@/services/api';
import { createOrder } from '@/services/orders';
import { createPaymentOrder, verifyPayment } from '@/services/payment';
import type { OrderShippingInput } from '@/types/order';
import type { PaymentOrder } from '@/types/payment';

/** Where the flow ended, so the caller can route/toast appropriately. */
export type PlaceOrderOutcome =
  | { status: 'success'; orderId: string }
  | { status: 'cancelled'; orderId: string }
  | { status: 'failed'; orderId: string; message: string }
  | { status: 'error'; orderId: string | null; message: string };

/** Coarse phase of the flow, surfaced so the button can label itself. */
export type PlaceOrderPhase =
  'idle' | 'creating-order' | 'starting-payment' | 'awaiting-payment' | 'verifying';

interface Prefill {
  name?: string;
  email?: string;
  contact?: string;
}

interface CheckoutPaymentState {
  /** Create an order from the cart, then take payment for it. */
  placeOrder: (shipping: OrderShippingInput) => Promise<PlaceOrderOutcome>;
  /** Retry payment for an already-created (pending) order. */
  payForOrder: (orderId: string, prefill?: Prefill) => Promise<PlaceOrderOutcome>;
  phase: PlaceOrderPhase;
  isProcessing: boolean;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

type PaymentResult =
  { status: 'success' } | { status: 'cancelled' } | { status: 'failed'; message: string };

/**
 * Open the Razorpay checkout for a created payment and verify the result.
 * Resolves once — dismissing the modal yields `cancelled`, a gateway error or a
 * failed verification yields `failed`.
 */
async function openAndVerify(
  payment: PaymentOrder,
  prefill: Prefill,
  onVerifying: () => void,
): Promise<PaymentResult> {
  if (!payment.razorpayOrderId) {
    return { status: 'failed', message: 'Payment could not be initialised.' };
  }
  const Razorpay = await loadRazorpay();
  const razorpayOrderId = payment.razorpayOrderId;

  return new Promise<PaymentResult>((resolve) => {
    let settled = false;
    const finish = (result: PaymentResult): void => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    const instance = new Razorpay({
      key: payment.key,
      amount: payment.amount,
      currency: payment.currency,
      order_id: razorpayOrderId,
      name: appConfig.name,
      description: 'Order payment',
      prefill,
      theme: { color: '#000000' },
      handler: (response) => {
        onVerifying();
        void verifyPayment({
          paymentId: payment.paymentId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        })
          .then(() => finish({ status: 'success' }))
          .catch((error: unknown) =>
            finish({
              status: 'failed',
              message: messageOf(error, 'We could not verify your payment.'),
            }),
          );
      },
      modal: { ondismiss: () => finish({ status: 'cancelled' }) },
    });

    instance.on('payment.failed', (response) => {
      finish({
        status: 'failed',
        message: response.error?.description ?? 'Your payment could not be completed.',
      });
    });

    instance.open();
  });
}

/**
 * Purchase orchestration: create an order and take payment (`placeOrder`), or
 * retry payment for an existing pending order (`payForOrder`). A single guard
 * prevents concurrent runs so a payment can never be started twice.
 */
export function useCheckoutPayment(): CheckoutPaymentState {
  const qc = useQueryClient();
  const user = useCurrentUser();
  const [phase, setPhase] = React.useState<PlaceOrderPhase>('idle');
  const running = React.useRef(false);

  const pay = React.useCallback(
    async (orderId: string, prefill: Prefill): Promise<PlaceOrderOutcome> => {
      setPhase('starting-payment');
      const payment = await createPaymentOrder(orderId);
      setPhase('awaiting-payment');
      const result = await openAndVerify(payment, prefill, () => setPhase('verifying'));

      if (result.status === 'success') {
        void qc.invalidateQueries({ queryKey: queryKeys.order(orderId) });
        return { status: 'success', orderId };
      }
      if (result.status === 'cancelled') {
        return { status: 'cancelled', orderId };
      }
      return { status: 'failed', orderId, message: result.message };
    },
    [qc],
  );

  const basePrefill = React.useCallback(
    (contact?: string): Prefill => ({
      ...(user?.name ? { name: user.name } : {}),
      ...(user?.email ? { email: user.email } : {}),
      ...(contact ? { contact } : {}),
    }),
    [user],
  );

  const placeOrder = React.useCallback(
    async (shipping: OrderShippingInput): Promise<PlaceOrderOutcome> => {
      if (running.current) {
        return { status: 'error', orderId: null, message: 'A payment is already in progress.' };
      }
      running.current = true;
      let createdOrderId: string | null = null;
      try {
        setPhase('creating-order');
        const order = await createOrder({ shippingAddress: shipping });
        createdOrderId = order.id;
        // The cart is cleared server-side the moment the order is created.
        qc.removeQueries({ queryKey: queryKeys.checkout() });
        void qc.invalidateQueries({ queryKey: queryKeys.cart() });
        return await pay(order.id, basePrefill(shipping.phone));
      } catch (error) {
        const message = messageOf(error, 'Something went wrong while placing your order.');
        // If the order exists, keep it retryable; only a pre-order failure is fatal.
        return createdOrderId
          ? { status: 'failed', orderId: createdOrderId, message }
          : { status: 'error', orderId: null, message };
      } finally {
        running.current = false;
        setPhase('idle');
      }
    },
    [qc, pay, basePrefill],
  );

  const payForOrder = React.useCallback(
    async (orderId: string, prefill?: Prefill): Promise<PlaceOrderOutcome> => {
      if (running.current) {
        return { status: 'error', orderId, message: 'A payment is already in progress.' };
      }
      running.current = true;
      try {
        return await pay(orderId, basePrefill(prefill?.contact));
      } catch (error) {
        return {
          status: 'error',
          orderId,
          message: messageOf(error, 'We could not start the payment.'),
        };
      } finally {
        running.current = false;
        setPhase('idle');
      }
    },
    [pay, basePrefill],
  );

  return { placeOrder, payForOrder, phase, isProcessing: phase !== 'idle' };
}
