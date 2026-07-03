import { api } from '@/services/api';
import type { AppNotification, NotificationType } from '@/types/notification';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}

/** Admin-only: send a notification to a specific user (`POST /notifications`). */
export function createNotification(input: CreateNotificationInput): Promise<AppNotification> {
  return api.post<AppNotification>('/notifications', input);
}
