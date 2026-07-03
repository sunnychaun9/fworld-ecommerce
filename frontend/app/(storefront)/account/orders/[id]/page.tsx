import type { Metadata } from 'next';
import * as React from 'react';

import { OrderDetailView } from '@/components/account/order-detail-view';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Order details',
  description: 'View your order details.',
  path: '/account/orders',
  noIndex: true,
});

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
