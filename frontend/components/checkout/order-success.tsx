'use client';

import { CircleCheck, PackageX } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useOrder } from '@/features/orders/use-orders';
import { formatCurrency } from '@/lib/format';
import { ApiError } from '@/services/api';

import { PaymentStatus } from './payment-status';

interface OrderSuccessProps {
  orderId: string;
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}): React.ReactElement {
  return (
    <div className={strong ? 'flex justify-between text-base font-medium' : 'flex justify-between'}>
      <dt className={strong ? '' : 'text-muted-foreground'}>{label}</dt>
      <dd className={strong ? 'tabular-nums' : 'font-medium tabular-nums'}>{value}</dd>
    </div>
  );
}

/** Order confirmation: number, payment status, items, totals and shipping. */
function OrderSuccess({ orderId }: OrderSuccessProps): React.ReactElement {
  const { data: order, isPending, isError, error, refetch } = useOrder(orderId);

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto h-6 w-64" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState
          icon={<PackageX />}
          title="Order not found"
          description="We couldn't find this order on your account."
          action={
            <Button asChild>
              <Link href={ROUTES.home}>Back to home</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const shortId = order.id.slice(0, 8).toUpperCase();
  const address = order.shippingAddress;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center text-center">
        <CircleCheck className="text-success size-14" aria-hidden="true" />
        <h1 className="text-foreground mt-4 text-2xl font-medium tracking-tight">
          Thank you for your order
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Order <span className="text-foreground font-medium">#{shortId}</span> is confirmed. A
          receipt is on its way to your inbox.
        </p>
        <div className="mt-4">
          <PaymentStatus status={order.paymentStatus} />
        </div>
      </div>

      <div className="border-border mt-10 rounded-lg border">
        <ul className="divide-border divide-y">
          {order.items.map((item) => {
            const variantLabel = [item.variantSize, item.variantColor].filter(Boolean).join(' · ');
            return (
              <li key={item.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium">{item.productName}</p>
                  {variantLabel ? (
                    <p className="text-muted-foreground mt-0.5 text-xs">{variantLabel}</p>
                  ) : null}
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <p className="text-foreground text-sm font-medium tabular-nums">
                  {formatCurrency(item.lineTotal)}
                </p>
              </li>
            );
          })}
        </ul>

        <dl className="border-border space-y-2.5 border-t p-4 text-sm">
          <TotalRow label="Subtotal" value={formatCurrency(order.subtotal)} />
          <TotalRow
            label="Shipping"
            value={Number(order.shipping) > 0 ? formatCurrency(order.shipping) : 'Free'}
          />
          {Number(order.tax) > 0 ? (
            <TotalRow label="Tax" value={formatCurrency(order.tax)} />
          ) : null}
          {Number(order.discount) > 0 ? (
            <TotalRow label="Discount" value={`−${formatCurrency(order.discount)}`} />
          ) : null}
          <div className="border-border border-t pt-2.5">
            <TotalRow label="Total paid" value={formatCurrency(order.grandTotal)} strong />
          </div>
        </dl>
      </div>

      <div className="border-border mt-6 rounded-lg border p-4 text-sm">
        <h2 className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-[0.15em]">
          Shipping to
        </h2>
        <p className="text-foreground font-medium">{address.fullName}</p>
        <p className="text-muted-foreground mt-0.5 leading-relaxed">
          {[
            address.addressLine1,
            address.addressLine2,
            `${address.city}, ${address.state} ${address.postalCode}`,
          ]
            .filter(Boolean)
            .join(', ')}
        </p>
        <p className="text-muted-foreground mt-0.5">{address.phone}</p>
      </div>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href={ROUTES.men}>Continue shopping</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={ROUTES.orders}>View orders</Link>
        </Button>
      </div>
    </div>
  );
}

export { OrderSuccess };
