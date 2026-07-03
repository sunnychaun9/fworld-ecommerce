'use client';

import { Users } from 'lucide-react';
import * as React from 'react';

import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/features/admin/use-dashboard';

import { EntityToolbar } from './entity-toolbar';
import { StatsCard } from './stats-card';

/**
 * Customers overview. The backend exposes only an aggregate customer count (via
 * the dashboard) — there is no user-listing endpoint yet, so the per-customer
 * table is intentionally deferred until that API exists.
 */
function CustomersView(): React.ReactElement {
  const { data, isPending, isError, refetch } = useDashboard();

  return (
    <div>
      <EntityToolbar title="Customers" description="Your registered shoppers." />
      {isPending ? (
        <Skeleton className="h-28 w-64 rounded-lg" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="max-w-xs">
            <StatsCard label="Total customers" value={data.customers.total} icon={<Users />} />
          </div>
          <div className="border-border text-muted-foreground rounded-lg border border-dashed p-6 text-sm leading-relaxed">
            A searchable customer directory will appear here once the backend exposes a user-listing
            endpoint. Today the API only provides the aggregate count above.
          </div>
        </div>
      )}
    </div>
  );
}

export { CustomersView };
