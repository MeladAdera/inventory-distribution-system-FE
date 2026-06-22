'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import type { Notification, NotificationListParams } from '../types/notifications.types';

export function useNotifications(params?: NotificationListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.list(params),
  });

  // Handles both flat { data: Notification[] } and paginated { data: { data: Notification[] } }
  const items: Notification[] = listQuery.data?.data?.data ?? listQuery.data?.data ?? [];

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    notifications: listQuery.data,
    items,
    unreadCount,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
  };
}
