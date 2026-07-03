'use client';

import { Check } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Address } from '@/types/address';

interface AddressCardProps {
  address: Address;
  /** Renders the card as a radio option in a selector. */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  busy?: boolean;
}

/** Presentational address card with optional selection and management actions. */
function AddressCard({
  address,
  selectable = false,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  busy = false,
}: AddressCardProps): React.ReactElement {
  const lines = [
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ].filter(Boolean);

  const body = (
    <>
      <div className="flex items-center gap-2">
        <span className="text-foreground text-sm font-medium">{address.fullName}</span>
        {address.isDefault ? (
          <Badge variant="secondary" className="text-[10px]">
            Default
          </Badge>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{address.phone}</p>
      <address className="text-muted-foreground mt-1 text-sm not-italic leading-relaxed">
        {lines.join(', ')}
      </address>
    </>
  );

  return (
    <div
      className={cn(
        'border-border rounded-lg border p-4 transition-colors',
        selectable && selected && 'border-foreground ring-foreground/20 ring-1',
      )}
    >
      {selectable ? (
        <button
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={onSelect}
          className="focus-visible:ring-ring flex w-full items-start gap-3 rounded-sm text-left outline-none focus-visible:ring-2"
        >
          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
              selected ? 'border-foreground bg-foreground text-background' : 'border-input',
            )}
          >
            {selected ? <Check className="size-3" /> : null}
          </span>
          <span className="flex-1">{body}</span>
        </button>
      ) : (
        body
      )}

      {onEdit || onDelete || onSetDefault ? (
        <div className="border-border text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              disabled={busy}
              className="hover:text-foreground transition-colors disabled:opacity-50"
            >
              Edit
            </button>
          ) : null}
          {onSetDefault && !address.isDefault ? (
            <button
              type="button"
              onClick={onSetDefault}
              disabled={busy}
              className="hover:text-foreground transition-colors disabled:opacity-50"
            >
              Set as default
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="hover:text-destructive transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { AddressCard };
