'use client';

import * as React from 'react';

import { ThemeToggle } from '@/components/common/theme-toggle';
import { appConfig } from '@/config/app';
import { useCurrentUser } from '@/features/auth/use-auth';
import { useUserRole } from '@/features/auth/use-role';

import { EntityToolbar } from './entity-toolbar';

function Row({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}

/** Read-only store/account settings. There is no server settings endpoint yet. */
function SettingsView(): React.ReactElement {
  const user = useCurrentUser();
  const role = useUserRole();

  return (
    <div>
      <EntityToolbar title="Settings" description="Store and account details." />
      <div className="max-w-xl space-y-4">
        <section className="border-border bg-background rounded-lg border p-5">
          <h2 className="text-foreground mb-2 text-sm font-medium">Store</h2>
          <dl className="divide-border divide-y">
            <Row label="Name" value={appConfig.name} />
            <Row label="URL" value={appConfig.url} />
            <Row label="Currency" value={appConfig.currency} />
            <Row label="Locale" value={appConfig.locale} />
          </dl>
        </section>

        <section className="border-border bg-background rounded-lg border p-5">
          <h2 className="text-foreground mb-2 text-sm font-medium">Signed in as</h2>
          <dl className="divide-border divide-y">
            <Row label="Name" value={user?.name ?? '—'} />
            <Row label="Email" value={user?.email ?? '—'} />
            <Row label="Role" value={role ?? '—'} />
          </dl>
        </section>

        <section className="border-border bg-background flex items-center justify-between rounded-lg border p-5">
          <div>
            <h2 className="text-foreground text-sm font-medium">Appearance</h2>
            <p className="text-muted-foreground text-sm">Toggle light or dark theme.</p>
          </div>
          <ThemeToggle />
        </section>

        <p className="text-muted-foreground text-xs">
          Editable store settings will appear here once a backend settings endpoint is available.
        </p>
      </div>
    </div>
  );
}

export { SettingsView };
