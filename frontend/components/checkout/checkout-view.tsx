'use client';

import { LogIn, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useAddresses } from '@/features/addresses/use-addresses';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { useCheckout } from '@/features/checkout/use-checkout';
import { ApiError } from '@/services/api';
import type { OrderShippingInput } from '@/types/order';

import { AddressSelector } from './address-selector';
import { CheckoutSummary } from './checkout-summary';
import { CouponBox, type AppliedCoupon } from './coupon-box';
import { OrderReview } from './order-review';
import { PaymentButton } from './payment-button';

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section>
      <h2 className="text-foreground mb-4 flex items-center gap-2.5 text-sm font-medium">
        <span className="border-border text-muted-foreground flex size-6 items-center justify-center rounded-full border text-xs tabular-nums">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Checkout orchestrator: address selection, order review, coupon and payment. */
function CheckoutView(): React.ReactElement {
  const authenticated = useIsAuthenticated();
  const { data: summary, isPending, isError, error, refetch } = useCheckout();
  const { data: addresses } = useAddresses();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [coupon, setCoupon] = React.useState<AppliedCoupon | null>(null);

  const selectedAddress = React.useMemo(
    () => addresses?.find((a) => a.id === selectedId) ?? null,
    [addresses, selectedId],
  );

  const shipping: OrderShippingInput | null = React.useMemo(() => {
    if (!selectedAddress) return null;
    return {
      fullName: selectedAddress.fullName,
      phone: selectedAddress.phone,
      addressLine1: selectedAddress.addressLine1,
      ...(selectedAddress.addressLine2 ? { addressLine2: selectedAddress.addressLine2 } : {}),
      city: selectedAddress.city,
      state: selectedAddress.state,
      postalCode: selectedAddress.postalCode,
    };
  }, [selectedAddress]);

  if (!authenticated) {
    return (
      <EmptyState
        icon={<LogIn />}
        title="Sign in to check out"
        description="You need an account to place an order."
        action={
          <Button asChild>
            <Link href={`${ROUTES.login}?redirect=${ROUTES.checkout}`}>Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (isPending) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.code === 'EMPTY_CART') {
      return (
        <EmptyState
          icon={<ShoppingBag />}
          title="Your bag is empty"
          description="Add something to your bag before checking out."
          action={
            <Button asChild>
              <Link href={ROUTES.men}>Start shopping</Link>
            </Button>
          }
        />
      );
    }
    return (
      <ErrorState
        description={error instanceof ApiError ? error.message : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  if (summary.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="Your bag is empty"
        description="Add something to your bag before checking out."
        action={
          <Button asChild>
            <Link href={ROUTES.men}>Start shopping</Link>
          </Button>
        }
      />
    );
  }

  const discount = coupon?.validation.valid ? coupon.validation.discount : 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-10">
        <Section step={1} title="Shipping address">
          <AddressSelector selectedId={selectedId} onSelect={setSelectedId} />
        </Section>

        <Section step={2} title="Review your order">
          <OrderReview items={summary.items} address={selectedAddress} />
        </Section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-border space-y-5 rounded-lg border p-6">
          <h2 className="text-foreground text-sm font-medium">Order summary</h2>

          <CouponBox
            orderAmount={summary.grandTotal}
            applied={coupon}
            onApply={setCoupon}
            onRemove={() => setCoupon(null)}
          />

          <CheckoutSummary summary={summary} discount={discount} couponCode={coupon?.code} />

          <div className="space-y-2">
            <PaymentButton shipping={shipping} className="w-full" />
            {!shipping ? (
              <p className="text-muted-foreground text-center text-xs">
                Select a shipping address to continue.
              </p>
            ) : null}
            <Button asChild variant="ghost" className="w-full">
              <Link href={ROUTES.cart}>Back to bag</Link>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export { CheckoutView };
