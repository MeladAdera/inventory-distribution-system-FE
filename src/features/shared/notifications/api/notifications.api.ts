import { apiClient } from '@/common/api';
import type { NotificationListParams } from '../types/notifications.types';

export const notificationsApi = {
  list: async (params?: NotificationListParams) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  markRead: async (id: number) => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },
};
