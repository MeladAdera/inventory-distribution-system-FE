'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import type { Notification, NotificationListParams } from '../types/notifications.types';

export function useNotifications(params?: NotificationListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.list(params),
    placeholderData: keepPreviousData,
  });

  // Handles both flat { data: Notification[] } and paginated { data: { data: Notification[] } }
  const paginated = listQuery.data?.data;
  const items: Notification[] = Array.isArray(paginated) ? paginated : (paginated?.data ?? []);

  const total: number = paginated?.total ?? items.length;
  const totalPages: number = paginated?.totalPages ?? 1;
  const hasNext: boolean = paginated?.hasNext ?? false;
  const hasPrev: boolean = paginated?.hasPrev ?? false;

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
    items,
    total,
    totalPages,
    hasNext,
    hasPrev,
    unreadCount,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    markRead: markReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
    markAllRead: markAllReadMutation.mutateAsync,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}
