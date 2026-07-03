import type { Metadata } from 'next';
import * as React from 'react';

import { AccountOverview } from '@/components/account/account-overview';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your account',
  description: 'Manage your FWorld account.',
  path: '/account',
  noIndex: true,
});

export default function AccountPage(): React.ReactElement {
  return <AccountOverview />;
}
