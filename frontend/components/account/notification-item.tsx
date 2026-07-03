'use client';

import { Bell, CreditCard, Package, RotateCcw, Tag, Truck, type LucideIcon } from 'lucide-react';
import * as React from 'react';

import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AppNotification, NotificationType } from '@/types/notification';

const ICONS: Record<NotificationType, LucideIcon> = {
  ORDER: Package,
  PAYMENT: CreditCard,
  SHIPPING: Truck,
  RETURN: RotateCcw,
  PROMOTION: Tag,
  SYSTEM: Bell,
};

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}

/** A single notification row. Marks itself read on activation when unread. */
function NotificationItem({ notification, onMarkRead }: NotificationItemProps): React.ReactElement {
  const unread = notification.readAt === null;
  const Icon = ICONS[notification.type] ?? Bell;

  function activate(): void {
    if (unread) onMarkRead(notification.id);
  }

  return (
    <li>
      <div
        className={cn(
          'flex gap-3 rounded-lg border p-4 transition-colors',
          unread ? 'border-border bg-accent/40' : 'border-transparent',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            unread ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-foreground text-sm font-medium">{notification.title}</p>
            {unread ? (
              <span className="bg-brand mt-1.5 size-2 shrink-0 rounded-full" aria-label="Unread" />
            ) : null}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
            {notification.message}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <time className="text-muted-foreground text-xs" dateTime={notification.createdAt}>
              {formatDateTime(notification.createdAt)}
            </time>
            {unread ? (
              <button
                type="button"
                onClick={activate}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                Mark as read
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

export { NotificationItem };
