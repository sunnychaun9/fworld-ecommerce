import type { Metadata } from 'next';
import * as React from 'react';

import { ProfileView } from '@/components/account/profile-view';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Profile',
  description: 'Your profile and session.',
  path: '/account/profile',
  noIndex: true,
});

export default function AccountProfilePage(): React.ReactElement {
  return (
    <div>
      <h1 className="text-foreground text-xl font-medium tracking-tight">Profile</h1>
      <p className="text-muted-foreground mt-1 text-sm">Your account details and session.</p>
      <div className="mt-8">
        <ProfileView />
      </div>
    </div>
  );
}
