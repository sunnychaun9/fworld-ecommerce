'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications';
import type { NotificationList } from '@/types/notification';

/** The current user's notifications with a live unread count. */
export function useNotifications() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: getNotifications,
    enabled: authenticated,
    staleTime: 30_000,
  });
}

/** Just the unread count — reads the shared notifications cache. */
export function useUnreadCount(): number {
  const { data } = useNotifications();
  return data?.unreadCount ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const key = queryKeys.notifications();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<NotificationList>(key);
      if (prev) {
        const now = new Date().toISOString();
        let unread = prev.unreadCount;
        const items = prev.items.map((n) => {
          if (n.id === id && n.readAt === null) {
            unread = Math.max(0, unread - 1);
            return { ...n, readAt: now };
          }
          return n;
        });
        qc.setQueryData<NotificationList>(key, { items, unreadCount: unread });
      }
      return { prev };
    },
    onError: (_error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const key = queryKeys.notifications();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<NotificationList>(key);
      if (prev) {
        const now = new Date().toISOString();
        qc.setQueryData<NotificationList>(key, {
          items: prev.items.map((n) => (n.readAt === null ? { ...n, readAt: now } : n)),
          unreadCount: 0,
        });
      }
      return { prev };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  });
}
