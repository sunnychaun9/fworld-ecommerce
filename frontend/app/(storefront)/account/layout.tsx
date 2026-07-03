import type { Metadata } from 'next';
import * as React from 'react';

import { AccountLayout } from '@/components/account/account-layout';

// The account area is private; keep every sub-route out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountRouteLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <AccountLayout>{children}</AccountLayout>;
}
