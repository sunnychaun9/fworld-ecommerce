import * as React from 'react';

import { AdminProductsView } from '@/components/admin/admin-products-view';

export default function AdminProductsPage(): React.ReactElement {
  return (
    <React.Suspense fallback={null}>
      <AdminProductsView />
    </React.Suspense>
  );
}
