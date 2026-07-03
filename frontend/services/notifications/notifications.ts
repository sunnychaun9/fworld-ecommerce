import { api } from '@/services/api';
import type { AppNotification, NotificationList } from '@/types/notification';

export function getNotifications(): Promise<NotificationList> {
  return api.get<NotificationList>('/notifications');
}

export function markNotificationRead(id: string): Promise<AppNotification> {
  return api.patch<AppNotification>(`/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return api.patch<{ updated: number }>('/notifications/read-all');
}
