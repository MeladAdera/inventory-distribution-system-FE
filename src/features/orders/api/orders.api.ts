import { apiClient } from '@/common/api';
import type { CreateOrderInput, UpdateOrderInput } from '../types/orders.types';

export const ordersApi = {
  list: async () => {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderInput) => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  update: async (id: string, data: UpdateOrderInput) => {
    const response = await apiClient.put(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/orders/${id}`);
    return response.data;
  },
};
