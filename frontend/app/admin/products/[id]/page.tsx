import * as React from 'react';

import { ProductEditView } from '@/components/admin/product-edit-view';

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  return <ProductEditView productId={id} />;
}
