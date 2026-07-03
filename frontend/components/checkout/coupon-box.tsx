'use client';

import { Check, Tag, X } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useValidateCoupon } from '@/features/checkout/use-checkout';
import { formatCurrency } from '@/lib/format';
import { ApiError } from '@/services/api';
import type { CouponValidation } from '@/types/coupon';

interface AppliedCoupon {
  code: string;
  validation: CouponValidation;
}

interface CouponBoxProps {
  orderAmount: number;
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
}

/**
 * Coupon entry with apply / remove. Validation and the computed discount come
 * straight from `POST /coupons/validate` — the amount is never derived locally.
 */
function CouponBox({
  orderAmount,
  applied,
  onApply,
  onRemove,
}: CouponBoxProps): React.ReactElement {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const validate = useValidateCoupon();

  function apply(): void {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Enter a coupon code.');
      return;
    }
    setError(null);
    validate.mutate(
      { code: trimmed, orderAmount },
      {
        onSuccess: (validation) => {
          if (!validation.valid) {
            setError(validation.message);
            return;
          }
          onApply({ code: trimmed.toUpperCase(), validation });
          setCode('');
        },
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : 'Could not apply the coupon.'),
      },
    );
  }

  if (applied) {
    return (
      <div className="border-success/40 bg-success/5 flex items-center justify-between rounded-md border px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <Check className="text-success size-4" aria-hidden="true" />
          <span className="text-foreground font-medium">{applied.code}</span>
          <span className="text-muted-foreground">
            − {formatCurrency(applied.validation.discount)}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove coupon"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <Tag
            className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply();
              }
            }}
            placeholder="Coupon code"
            aria-label="Coupon code"
            aria-invalid={error ? true : undefined}
            className="pl-9 uppercase"
          />
        </div>
        <Button type="button" variant="outline" onClick={apply} disabled={validate.isPending}>
          {validate.isPending ? 'Applying…' : 'Apply'}
        </Button>
      </div>
      {error ? <p className="text-destructive mt-1.5 text-xs">{error}</p> : null}
    </div>
  );
}

export { CouponBox };
export type { AppliedCoupon };
