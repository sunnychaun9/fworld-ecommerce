import type { Metadata } from 'next';
import * as React from 'react';

import { OrdersView } from '@/components/account/orders-view';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your orders',
  description: 'Track and manage your orders.',
  path: '/account/orders',
  noIndex: true,
});

export default function AccountOrdersPage(): React.ReactElement {
  return (
    <div>
      <h1 className="text-foreground text-xl font-medium tracking-tight">Orders</h1>
      <p className="text-muted-foreground mt-1 text-sm">Track and manage your orders.</p>
      <div className="mt-8">
        <OrdersView />
      </div>
    </div>
  );
}
