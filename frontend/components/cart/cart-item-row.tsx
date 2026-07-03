'use client';

import { Minus, Plus, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import { MediaImage } from '@/components/common/media-image';
import { Button } from '@/components/ui/button';
import { useRemoveCartItem, useUpdateCartItem } from '@/features/cart/use-cart';
import { ApiError } from '@/services/api';
import { formatCurrency } from '@/lib/format';
import type { CartItem } from '@/types/cart';

const onError = (error: unknown): void => {
  toast.error(error instanceof ApiError ? error.message : 'Something went wrong.');
};

function CartItemRow({ item }: { item: CartItem }): React.ReactElement {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const max = item.inventory?.availableStock ?? item.quantity;
  const image = item.images[0];
  const variantLabel = [item.variant.size, item.variant.color].filter(Boolean).join(' · ');
  const href = `/product/${item.product.slug}`;

  const setQuantity = (quantity: number): void =>
    update.mutate({ itemId: item.id, quantity }, { onError });

  return (
    <li className="flex gap-4 py-6">
      <Link
        href={href}
        className="bg-muted relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-md sm:w-24"
      >
        <MediaImage src={image?.url} alt={image?.altText ?? item.product.name} sizes="96px" />
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <Link href={href} className="text-foreground text-sm font-medium hover:underline">
              {item.product.name}
            </Link>
            {variantLabel ? (
              <p className="text-muted-foreground mt-1 text-xs">{variantLabel}</p>
            ) : null}
            <p className="text-muted-foreground mt-1 text-xs">
              {formatCurrency(item.unitPrice)} each
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${item.product.name}`}
            onClick={() => remove.mutate(item.id, { onError })}
            disabled={remove.isPending}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="border-input flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Decrease quantity"
              disabled={update.isPending || item.quantity <= 1}
              onClick={() => setQuantity(item.quantity - 1)}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-9 text-center text-sm tabular-nums">{item.quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Increase quantity"
              disabled={update.isPending || item.quantity >= max}
              onClick={() => setQuantity(item.quantity + 1)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <p className="text-foreground text-sm font-medium tabular-nums">
            {formatCurrency(item.lineTotal)}
          </p>
        </div>
      </div>
    </li>
  );
}

export { CartItemRow };
