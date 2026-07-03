import * as React from 'react';

import { DashboardView } from '@/components/admin/dashboard-view';

export default function AdminDashboardPage(): React.ReactElement {
  return (
    <div>
      <h1 className="text-foreground mb-6 text-xl font-semibold tracking-tight">Dashboard</h1>
      <DashboardView />
    </div>
  );
}
