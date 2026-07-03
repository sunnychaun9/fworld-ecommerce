import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { discountPercent, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface PriceProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Current price. Accepts the backend's decimal-string or a number. */
  amount: number | string;
  /** Original price, shown struck-through when higher than `amount`. */
  compareAt?: number | string | null;
  /** Render the discount percentage as a badge. */
  showDiscount?: boolean;
}

/**
 * Renders a formatted INR price with an optional compare-at (sale) price and
 * discount badge. Presentation only — no data fetching.
 */
function Price({
  amount,
  compareAt,
  showDiscount = false,
  className,
  ...props
}: PriceProps): React.ReactElement {
  const hasCompare = compareAt != null && Number(compareAt) > Number(amount);
  const percent = hasCompare ? discountPercent(amount, compareAt) : 0;

  return (
    <div data-slot="price" className={cn('flex items-baseline gap-2', className)} {...props}>
      <span className="text-foreground font-medium tabular-nums">{formatCurrency(amount)}</span>
      {hasCompare ? (
        <span className="text-muted-foreground text-sm tabular-nums line-through">
          {formatCurrency(compareAt)}
        </span>
      ) : null}
      {showDiscount && percent > 0 ? (
        <Badge variant="brand" className="ml-0.5">
          -{percent}%
        </Badge>
      ) : null}
    </div>
  );
}

export { Price };
