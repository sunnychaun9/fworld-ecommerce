'use client';

import * as React from 'react';

import { MediaImage } from '@/components/common/media-image';
import { formatCurrency } from '@/lib/format';
import type { Address } from '@/types/address';
import type { CheckoutItem } from '@/types/checkout';

interface OrderReviewProps {
  items: CheckoutItem[];
  address: Address | null;
}

/** Read-only review of the items being purchased and the shipping destination. */
function OrderReview({ items, address }: OrderReviewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {address ? (
        <div className="text-sm">
          <h3 className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-[0.15em]">
            Shipping to
          </h3>
          <p className="text-foreground font-medium">{address.fullName}</p>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">
            {[
              address.addressLine1,
              address.addressLine2,
              `${address.city}, ${address.state} ${address.postalCode}`,
              address.country,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
          <p className="text-muted-foreground mt-0.5">{address.phone}</p>
        </div>
      ) : null}

      <ul className="divide-border border-border divide-y border-y">
        {items.map((item) => {
          const variantLabel = [item.variant.size, item.variant.color].filter(Boolean).join(' · ');
          return (
            <li key={item.variantId} className="flex gap-4 py-4">
              <div className="bg-muted relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-md">
                <MediaImage
                  src={item.image?.url}
                  alt={item.image?.altText ?? item.product.name}
                  sizes="64px"
                />
                <span className="bg-foreground text-background absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full text-[10px] font-medium tabular-nums">
                  {item.quantity}
                </span>
              </div>
              <div className="flex flex-1 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium">{item.product.name}</p>
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
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { OrderReview };
