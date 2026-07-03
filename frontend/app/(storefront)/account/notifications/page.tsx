import type { Metadata } from 'next';
import * as React from 'react';

import { NotificationsView } from '@/components/account/notifications-view';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Notifications',
  description: 'Your notifications.',
  path: '/account/notifications',
  noIndex: true,
});

export default function AccountNotificationsPage(): React.ReactElement {
  return (
    <div>
      <h1 className="text-foreground text-xl font-medium tracking-tight">Notifications</h1>
      <p className="text-muted-foreground mt-1 text-sm">Updates about your orders and account.</p>
      <div className="mt-8">
        <NotificationsView />
      </div>
    </div>
  );
}
