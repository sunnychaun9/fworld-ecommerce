'use client';

import { BellOff } from 'lucide-react';
import * as React from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/use-notifications';
import { formatDate } from '@/lib/format';
import type { AppNotification } from '@/types/notification';

import { NotificationItem } from './notification-item';

/** Human day label for grouping (Today / Yesterday / date). */
function dayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date): number =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return formatDate(iso);
}

function groupByDay(items: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const groups: { label: string; items: AppNotification[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }
  return groups;
}

/** Notification centre: grouped by day, with per-item and bulk read marking. */
function NotificationsView(): React.ReactElement {
  const { data, isPending, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<BellOff />}
        title="No notifications"
        description="Updates about your orders and account will show up here."
      />
    );
  }

  const groups = groupByDay(data.items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {data.unreadCount > 0 ? `${data.unreadCount} unread` : 'All caught up'}
          </span>
          {data.unreadCount > 0 ? (
            <Badge variant="brand" className="tabular-nums">
              {data.unreadCount}
            </Badge>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markAll.mutate()}
          disabled={data.unreadCount === 0 || markAll.isPending}
        >
          Mark all read
        </Button>
      </div>

      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-[0.15em]">
            {group.label}
          </h2>
          <ul className="space-y-2">
            {group.items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => markRead.mutate(id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export { NotificationsView };
