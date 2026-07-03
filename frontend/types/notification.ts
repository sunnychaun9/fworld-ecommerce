export type NotificationType = 'ORDER' | 'PAYMENT' | 'SHIPPING' | 'RETURN' | 'PROMOTION' | 'SYSTEM';

/**
 * A user notification (`GET /notifications`). Named `AppNotification` to avoid
 * shadowing the DOM `Notification`. Unread ⇔ `readAt === null`.
 */
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

/** `GET /notifications` response — the list plus a live unread count. */
export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}
