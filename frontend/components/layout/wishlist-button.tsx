import { Heart } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WishlistButtonProps extends React.ComponentProps<typeof Button> {
  /** Saved-item count shown as a badge (presentational only in this phase). */
  count?: number;
}

/**
 * Wishlist trigger for the header. Navigation/affordance only — wishlist state
 * is wired in a later phase.
 */
function WishlistButton({
  count = 0,
  className,
  ...props
}: WishlistButtonProps): React.ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Wishlist, ${count} saved`}
      className={cn('relative', className)}
      {...props}
    >
      <Heart className="size-5" />
      {count > 0 ? (
        <span className="bg-brand text-brand-foreground absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Button>
  );
}

export { WishlistButton };
