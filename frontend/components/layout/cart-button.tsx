import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CartButtonProps extends React.ComponentProps<typeof Button> {
  /** Item count shown as a badge. */
  count?: number;
  /** When provided, renders as a link to the cart page. */
  href?: string;
}

function CartBadge({ count }: { count: number }): React.ReactElement | null {
  if (count <= 0) return null;
  return (
    <span className="bg-brand text-brand-foreground absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none">
      {count > 9 ? '9+' : count}
    </span>
  );
}

/** Cart trigger for the header. Renders a link when `href` is set. */
function CartButton({ count = 0, href, className, ...props }: CartButtonProps): React.ReactElement {
  const label = `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;

  if (href) {
    return (
      <Button
        asChild
        variant="ghost"
        size="icon"
        aria-label={label}
        className={cn('relative', className)}
      >
        <Link href={href}>
          <ShoppingBag className="size-5" />
          <CartBadge count={count} />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn('relative', className)}
      {...props}
    >
      <ShoppingBag className="size-5" />
      <CartBadge count={count} />
    </Button>
  );
}

export { CartButton };
