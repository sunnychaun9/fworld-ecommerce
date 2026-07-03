'use client';

import { CircleAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useCheckoutPayment } from '@/features/payment/use-place-order';

/**
 * Payment failure surface. When an `orderId` is present the payment can be
 * retried for that existing (pending) order without creating a new one.
 */
function PaymentFailed(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const { payForOrder, isProcessing } = useCheckoutPayment();

  async function onRetry(): Promise<void> {
    if (!orderId) {
      router.push(ROUTES.cart);
      return;
    }
    const outcome = await payForOrder(orderId);
    switch (outcome.status) {
      case 'success':
        toast.success('Payment successful');
        router.push(ROUTES.orderSuccess(outcome.orderId));
        break;
      case 'cancelled':
        toast('Payment cancelled. You can retry when you are ready.');
        break;
      case 'failed':
      case 'error':
        toast.error(outcome.message);
        break;
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8 text-center">
      <CircleAlert className="text-destructive size-14" aria-hidden="true" />
      <h1 className="text-foreground mt-4 text-2xl font-medium tracking-tight">
        Payment unsuccessful
      </h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        Your payment didn&apos;t go through and you have not been charged. Your order is saved — you
        can try paying again.
      </p>

      <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button
          size="lg"
          onClick={() => void onRetry()}
          disabled={isProcessing}
          aria-busy={isProcessing}
        >
          {isProcessing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Retry payment
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={ROUTES.cart}>Return to bag</Link>
        </Button>
      </div>
    </div>
  );
}

export { PaymentFailed };
