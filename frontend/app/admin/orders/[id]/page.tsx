import * as React from 'react';

import { AdminOrderDetailView } from '@/components/admin/admin-order-detail-view';

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  return <AdminOrderDetailView orderId={id} />;
}
