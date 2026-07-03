import type { Metadata } from 'next';
import * as React from 'react';

import { AddressesView } from '@/components/account/addresses-view';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your addresses',
  description: 'Manage your shipping addresses.',
  path: '/account/addresses',
  noIndex: true,
});

export default function AccountAddressesPage(): React.ReactElement {
  return (
    <div>
      <h1 className="text-foreground text-xl font-medium tracking-tight">Addresses</h1>
      <p className="text-muted-foreground mt-1 text-sm">Manage your shipping addresses.</p>
      <div className="mt-8">
        <AddressesView />
      </div>
    </div>
  );
}
