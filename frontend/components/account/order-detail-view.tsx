'use client';

import { ArrowLeft, FileText, PackageX, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useAddToCart } from '@/features/cart/use-cart';
import { useOrder, useOrderTracking } from '@/features/orders/use-orders';
import { useReturns } from '@/features/returns/use-returns';
import { ApiError } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/format';

import { OrderStatusBadge, PaymentStatusBadge, ReturnStatusBadge } from './status';
import { OrderTimeline } from './order-timeline';
import { ReturnCard } from './return-card';
import { ReturnItemDialog } from './return-item-dialog';
import { TrackingTimeline } from './tracking-timeline';

function SummaryRow({
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

/** Full order detail: items, fulfilment timeline, tracking, returns and actions. */
function OrderDetailView({ orderId }: { orderId: string }): React.ReactElement {
  const router = useRouter();
  const { data: order, isPending, isError, error, refetch } = useOrder(orderId);
  const tracking = useOrderTracking(orderId);
  const returns = useReturns();
  const addToCart = useAddToCart();
  const [buying, setBuying] = React.useState(false);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-72 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
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
              <Link href={ROUTES.accountOrders}>Back to orders</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const shortId = order.id.slice(0, 8).toUpperCase();
  const address = order.shippingAddress;
  const isDelivered = order.status === 'DELIVERED' || order.status === 'COMPLETED';
  const trackingData = tracking.data ?? null;
  const returnByItem = new Map(
    (returns.data ?? []).filter((r) => r.orderId === order.id).map((r) => [r.orderItemId, r]),
  );
  const orderReturns = (returns.data ?? []).filter((r) => r.orderId === order.id);
  const trackingUrl = trackingData?.trackingUrl ?? null;
  const orderItems = order.items;

  async function buyAgain(): Promise<void> {
    const items = orderItems.filter((item) => item.variantId);
    if (items.length === 0) {
      toast.error('These items are no longer available.');
      return;
    }
    setBuying(true);
    let added = 0;
    for (const item of items) {
      try {
        await addToCart.mutateAsync({
          variantId: item.variantId as string,
          quantity: item.quantity,
        });
        added += 1;
      } catch {
        // Skip items that are out of stock or unavailable.
      }
    }
    setBuying(false);
    if (added === 0) {
      toast.error('These items are currently out of stock.');
      return;
    }
    toast.success('Added to your bag');
    router.push(ROUTES.cart);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={ROUTES.accountOrders}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          All orders
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-foreground text-xl font-medium tracking-tight">Order #{shortId}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
      </div>

      <div className="border-border rounded-lg border p-5">
        <OrderTimeline status={order.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void buyAgain()} disabled={buying}>
          <RotateCcw className="size-4" />
          {buying ? 'Adding…' : 'Buy again'}
        </Button>
        {trackingUrl ? (
          <Button asChild variant="outline">
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
              Track order
            </a>
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => toast('Invoice downloads are coming soon.')}>
          <FileText className="size-4" />
          Download invoice
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <section>
            <h2 className="text-foreground mb-4 text-sm font-medium">Items</h2>
            <ul className="divide-border border-border divide-y border-y">
              {order.items.map((item) => {
                const variantLabel = [item.variantSize, item.variantColor]
                  .filter(Boolean)
                  .join(' · ');
                const existingReturn = returnByItem.get(item.id);
                return (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-medium">{item.productName}</p>
                      {variantLabel ? (
                        <p className="text-muted-foreground mt-0.5 text-xs">{variantLabel}</p>
                      ) : null}
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                      {isDelivered ? (
                        <div className="mt-2">
                          {existingReturn ? (
                            <span className="inline-flex items-center gap-1.5 text-xs">
                              <span className="text-muted-foreground">Return:</span>
                              <ReturnStatusBadge status={existingReturn.status} />
                            </span>
                          ) : (
                            <ReturnItemDialog
                              orderItemId={item.id}
                              productName={item.productName}
                              trigger={
                                <Button variant="outline" size="sm">
                                  Return item
                                </Button>
                              }
                            />
                          )}
                        </div>
                      ) : null}
                    </div>
                    <p className="text-foreground shrink-0 text-sm font-medium tabular-nums">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </li>
                );
              })}
            </ul>
            {!isDelivered && order.status !== 'CANCELLED' ? (
              <p className="text-muted-foreground mt-3 text-xs">
                Items can be returned within 7 days of delivery.
              </p>
            ) : null}
          </section>

          {orderReturns.length > 0 ? (
            <section>
              <h2 className="text-foreground mb-4 text-sm font-medium">Returns</h2>
              <div className="space-y-3">
                {orderReturns.map((entry) => (
                  <ReturnCard key={entry.id} returnRequest={entry} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="border-border rounded-lg border p-5">
            <h2 className="text-foreground mb-4 text-sm font-medium">Summary</h2>
            <dl className="space-y-2.5 text-sm">
              <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
              <SummaryRow
                label="Shipping"
                value={Number(order.shipping) > 0 ? formatCurrency(order.shipping) : 'Free'}
              />
              {Number(order.tax) > 0 ? (
                <SummaryRow label="Tax" value={formatCurrency(order.tax)} />
              ) : null}
              {Number(order.discount) > 0 ? (
                <SummaryRow label="Discount" value={`−${formatCurrency(order.discount)}`} />
              ) : null}
              <div className="border-border border-t pt-2.5">
                <SummaryRow label="Total" value={formatCurrency(order.grandTotal)} strong />
              </div>
            </dl>
          </div>

          <div className="border-border rounded-lg border p-5 text-sm">
            <h2 className="text-foreground mb-3 text-sm font-medium">Shipping address</h2>
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

          <div className="border-border rounded-lg border p-5">
            <h2 className="text-foreground mb-4 text-sm font-medium">Tracking</h2>
            {tracking.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <TrackingTimeline status={order.status} tracking={trackingData} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export { OrderDetailView };
