'use client';

import { ChevronRight, Heart, MapPin, Package, Star } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useCurrentUser } from '@/features/auth/use-auth';
import { useUnreadCount } from '@/features/notifications/use-notifications';
import { useOrders } from '@/features/orders/use-orders';
import { useWishlist } from '@/features/wishlist/use-wishlist';

import { OrderCard } from './order-card';

function StatTile({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof Package;
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="border-border hover:border-foreground/30 focus-visible:ring-ring group rounded-lg border p-4 outline-none transition-colors focus-visible:ring-2"
    >
      <div className="text-muted-foreground flex items-center justify-between">
        <Icon className="size-5" aria-hidden="true" />
        <ChevronRight className="group-hover:text-foreground size-4 transition-colors" />
      </div>
      <p className="text-foreground mt-3 text-2xl font-medium tabular-nums">{value}</p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </Link>
  );
}

/** Account dashboard: greeting, quick stats and the most recent orders. */
function AccountOverview(): React.ReactElement {
  const user = useCurrentUser();
  const orders = useOrders(1, 3);
  const wishlist = useWishlist();
  const unread = useUnreadCount();

  const orderCount = orders.data?.pageInfo.total;
  const recent = orders.data?.items ?? [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-foreground text-xl font-medium tracking-tight">
          Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your orders, wishlist and account details.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          href={ROUTES.accountOrders}
          icon={Package}
          label="Orders"
          value={orderCount ?? '—'}
        />
        <StatTile
          href={ROUTES.accountWishlist}
          icon={Heart}
          label="Wishlist"
          value={wishlist.data?.length ?? '—'}
        />
        <StatTile href={ROUTES.accountNotifications} icon={Star} label="Unread" value={unread} />
        <StatTile href={ROUTES.accountAddresses} icon={MapPin} label="Addresses" value="Manage" />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-sm font-medium">Recent orders</h2>
          {recent.length > 0 ? (
            <Button asChild variant="link" className="h-auto px-0 text-sm">
              <Link href={ROUTES.accountOrders}>View all</Link>
            </Button>
          ) : null}
        </div>

        {orders.isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="border-border text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            You haven&apos;t placed any orders yet.{' '}
            <Link href={ROUTES.men} className="text-foreground underline underline-offset-4">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recent.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export { AccountOverview };
