'use client';

import { ArrowLeft, PackageX, Truck } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useAdminOrder } from '@/features/admin/use-admin-orders';
import { ApiError } from '@/services/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

import { OrderStatusDialog } from './order-status-dialog';
import { ShipmentDialog } from './shipment-dialog';
import { StatusBadge } from './status-badge';

function Row({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="border-border bg-background rounded-lg border p-5">
      <h2 className="text-foreground mb-4 text-sm font-medium">{title}</h2>
      {children}
    </div>
  );
}

function AdminOrderDetailView({ orderId }: { orderId: string }): React.ReactElement {
  const { data: order, isPending, isError, error, refetch } = useAdminOrder(orderId);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
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
          action={
            <Button asChild>
              <Link href={ROUTES.adminOrders}>Back to orders</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const address = order.shippingAddress;
  const shipment = order.shipment;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.adminOrders}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Orders
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusDialog
              orderId={order.id}
              currentStatus={order.status}
              trigger={<Button variant="outline">Update status</Button>}
            />
            <ShipmentDialog
              orderId={order.id}
              shipment={shipment}
              trigger={
                <Button>
                  <Truck className="size-4" />
                  {shipment ? 'Manage shipment' : 'Create shipment'}
                </Button>
              }
            />
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Placed {formatDateTime(order.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-border divide-y">
              {order.items.map((item) => {
                const variant = [item.variantSize, item.variantColor].filter(Boolean).join(' · ');
                return (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <div>
                      <p className="text-foreground font-medium">{item.productName}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.variantSku}
                        {variant ? ` · ${variant}` : ''}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-foreground font-medium tabular-nums">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Status history">
            {order.statusHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No history yet.</p>
            ) : (
              <ol className="relative space-y-4">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <span className="bg-foreground mt-1.5 size-2 shrink-0 rounded-full" />
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.status} />
                        <span className="text-muted-foreground text-xs">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </div>
                      {entry.note ? (
                        <p className="text-muted-foreground mt-1 text-sm">{entry.note}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {order.payments.length > 0 ? (
            <Panel title="Payments">
              <ul className="divide-border divide-y">
                {order.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <div>
                      <p className="text-foreground font-medium">
                        {payment.provider} · {formatCurrency(payment.amount)} {payment.currency}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(payment.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Panel title="Summary">
            <dl className="space-y-2.5">
              <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
              <Row label="Shipping" value={formatCurrency(order.shipping)} />
              <Row label="Tax" value={formatCurrency(order.tax)} />
              <Row label="Discount" value={`−${formatCurrency(order.discount)}`} />
              <div className="border-border border-t pt-2.5">
                <Row label="Total" value={formatCurrency(order.grandTotal)} />
              </div>
            </dl>
          </Panel>

          <Panel title="Customer">
            <p className="text-foreground text-sm font-medium">{order.user.name ?? '—'}</p>
            <p className="text-muted-foreground text-sm">{order.user.email}</p>
          </Panel>

          <Panel title="Shipping address">
            <p className="text-foreground text-sm font-medium">{address.fullName}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {[
                address.addressLine1,
                address.addressLine2,
                `${address.city}, ${address.state} ${address.postalCode}`,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            <p className="text-muted-foreground text-sm">{address.phone}</p>
          </Panel>

          <Panel title="Shipment">
            {shipment ? (
              <dl className="space-y-2.5">
                <Row label="Courier" value={shipment.courier} />
                <Row label="Tracking" value={shipment.trackingNumber} />
                {shipment.shippedAt ? (
                  <Row label="Shipped" value={formatDate(shipment.shippedAt)} />
                ) : null}
                {shipment.deliveredAt ? (
                  <Row label="Delivered" value={formatDate(shipment.deliveredAt)} />
                ) : null}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">
                No shipment yet. Create one to ship this order.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

export { AdminOrderDetailView };
