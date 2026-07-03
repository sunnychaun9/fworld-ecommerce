'use client';

import * as React from 'react';

import { formatCurrency } from '@/lib/format';
import type { CheckoutSummary as CheckoutSummaryData } from '@/types/checkout';

interface CheckoutSummaryProps {
  summary: CheckoutSummaryData;
  /** Coupon discount to preview against the summary (see checkout-view note). */
  discount?: number;
  couponCode?: string | null;
}

function Row({
  label,
  value,
  muted,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  muted?: boolean;
}): React.ReactElement {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={muted ? 'text-muted-foreground' : 'font-medium tabular-nums'}>{value}</dd>
    </div>
  );
}

/** Money breakdown for the checkout: subtotal, shipping, tax, discount, total. */
function CheckoutSummary({
  summary,
  discount = 0,
  couponCode,
}: CheckoutSummaryProps): React.ReactElement {
  const itemCount = summary.items.reduce((total, item) => total + item.quantity, 0);
  const total = Math.max(0, summary.grandTotal - discount);

  return (
    <dl className="space-y-3 text-sm">
      <Row
        label={`Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
        value={formatCurrency(summary.subtotal)}
      />
      <Row
        label="Shipping"
        value={summary.shipping > 0 ? formatCurrency(summary.shipping) : 'Free'}
        muted={summary.shipping === 0}
      />
      {summary.tax > 0 ? <Row label="Tax" value={formatCurrency(summary.tax)} /> : null}
      {discount > 0 ? (
        <div className="text-success flex justify-between">
          <dt>Coupon{couponCode ? ` (${couponCode})` : ''}</dt>
          <dd className="font-medium tabular-nums">−{formatCurrency(discount)}</dd>
        </div>
      ) : null}
      <div className="border-border mt-1 flex justify-between border-t pt-3 text-base font-medium">
        <span>Total</span>
        <span className="tabular-nums">{formatCurrency(total)}</span>
      </div>
    </dl>
  );
}

export { CheckoutSummary };
