import type { Metadata } from 'next';
import * as React from 'react';

import { AdminLayout } from '@/components/admin/admin-layout';

// The admin area is private and must never be indexed.
export const metadata: Metadata = {
  title: 'Admin · FWorld',
  robots: { index: false, follow: false },
};

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <AdminLayout>{children}</AdminLayout>;
}
