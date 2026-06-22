import { apiClient } from '@/common/api';
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  OrderListParams,
} from '../types/orders.types';

export const ordersApi = {
  list: async (params?: OrderListParams) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderInput) => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateOrderStatusInput) => {
    const response = await apiClient.patch(`/orders/${id}/status`, data);
    return response.data;
  },
};
