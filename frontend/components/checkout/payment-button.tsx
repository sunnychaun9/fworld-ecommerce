'use client';

import { Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useCheckoutPayment, type PlaceOrderPhase } from '@/features/payment/use-place-order';
import type { OrderShippingInput } from '@/types/order';

interface PaymentButtonProps {
  /** The selected shipping address, or null when none is chosen yet. */
  shipping: OrderShippingInput | null;
  className?: string;
}

const PHASE_LABEL: Record<Exclude<PlaceOrderPhase, 'idle'>, string> = {
  'creating-order': 'Placing order…',
  'starting-payment': 'Starting payment…',
  'awaiting-payment': 'Waiting for payment…',
  verifying: 'Verifying payment…',
};

/**
 * Drives the create-order → Razorpay → verify flow and routes on the outcome.
 * Disabled without a shipping address and while a payment is in progress, so it
 * can never trigger a duplicate charge.
 */
function PaymentButton({ shipping, className }: PaymentButtonProps): React.ReactElement {
  const router = useRouter();
  const { placeOrder, phase, isProcessing } = useCheckoutPayment();

  async function onClick(): Promise<void> {
    if (!shipping) {
      toast.error('Select a shipping address to continue.');
      return;
    }
    const outcome = await placeOrder(shipping);
    switch (outcome.status) {
      case 'success':
        toast.success('Payment successful');
        router.push(ROUTES.orderSuccess(outcome.orderId));
        break;
      case 'cancelled':
        toast('Payment cancelled. You can retry when you are ready.');
        router.push(`${ROUTES.paymentFailed}?orderId=${outcome.orderId}`);
        break;
      case 'failed':
        toast.error(outcome.message);
        router.push(`${ROUTES.paymentFailed}?orderId=${outcome.orderId}`);
        break;
      case 'error':
        toast.error(outcome.message);
        break;
    }
  }

  const label = phase === 'idle' ? 'Continue to payment' : PHASE_LABEL[phase];

  return (
    <Button
      type="button"
      size="lg"
      className={className}
      onClick={() => void onClick()}
      disabled={!shipping || isProcessing}
      aria-busy={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Lock className="size-4" aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}

export { PaymentButton };
