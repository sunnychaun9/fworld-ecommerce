import * as React from 'react';

import { Badge } from '@/components/ui/badge';

export type ProductBadgeKind = 'new' | 'sale' | 'bestseller' | 'sold-out' | 'low-stock';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

const BADGE_CONFIG: Record<ProductBadgeKind, { label: string; variant: BadgeVariant }> = {
  new: { label: 'New', variant: 'brand' },
  sale: { label: 'Sale', variant: 'destructive' },
  bestseller: { label: 'Bestseller', variant: 'default' },
  'sold-out': { label: 'Sold out', variant: 'secondary' },
  'low-stock': { label: 'Low stock', variant: 'outline' },
};

interface ProductBadgeProps extends Omit<
  React.ComponentProps<typeof Badge>,
  'variant' | 'children'
> {
  kind: ProductBadgeKind;
  /** Override the default label for the given kind. */
  label?: string;
}

/**
 * A semantic merchandising pill (New / Sale / Sold out …) built on {@link Badge}.
 * Generic and presentational — safe to reuse across catalog surfaces.
 */
function ProductBadge({ kind, label, ...props }: ProductBadgeProps): React.ReactElement {
  const config = BADGE_CONFIG[kind];
  return (
    <Badge variant={config.variant} {...props}>
      {label ?? config.label}
    </Badge>
  );
}

export { ProductBadge };
