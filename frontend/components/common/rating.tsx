import { Star } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface RatingProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Rating value on a 0–5 scale. */
  value: number;
  /** Optional count shown alongside the stars. */
  count?: number;
  /** Star edge length in px. */
  size?: number;
}

const MAX = 5;

/**
 * Read-only star rating. Renders five stars filled proportionally to `value`
 * (to the nearest half) and exposes an accessible label.
 */
function Rating({ value, count, size = 16, className, ...props }: RatingProps): React.ReactElement {
  const clamped = Math.max(0, Math.min(MAX, value));
  const rounded = Math.round(clamped * 2) / 2;

  return (
    <div
      data-slot="rating"
      role="img"
      aria-label={`Rated ${rounded} out of ${MAX}${count != null ? ` from ${count} reviews` : ''}`}
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    >
      <span className="inline-flex items-center" aria-hidden="true">
        {Array.from({ length: MAX }, (_, i) => {
          const fill = Math.max(0, Math.min(1, rounded - i));
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star
                className="text-muted-foreground/40 absolute inset-0"
                style={{ width: size, height: size }}
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className="fill-brand text-brand" style={{ width: size, height: size }} />
              </span>
            </span>
          );
        })}
      </span>
      {count != null ? <span className="text-muted-foreground text-sm">({count})</span> : null}
    </div>
  );
}

export { Rating };
