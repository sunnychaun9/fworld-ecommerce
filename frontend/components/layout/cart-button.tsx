import { ShoppingBag } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CartButtonProps extends React.ComponentProps<typeof Button> {
  /** Item count shown as a badge (presentational only in this phase). */
  count?: number;
}

/**
 * Cart trigger for the header. Navigation/affordance only — the cart drawer and
 * its state are wired in a later phase.
 */
function CartButton({ count = 0, className, ...props }: CartButtonProps): React.ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      className={cn('relative', className)}
      {...props}
    >
      <ShoppingBag className="size-5" />
      {count > 0 ? (
        <span className="bg-brand text-brand-foreground absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Button>
  );
}

export { CartButton };
