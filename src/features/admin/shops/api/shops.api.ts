import { apiClient } from '@/common/api';
import type { ShopListParams, UpdateShopInput, UpdateShopStatusInput } from '../types/shops.types';

export const shopsApi = {
  list: async (params?: ShopListParams) => {
    const response = await apiClient.get('/shops', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/shops/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateShopInput) => {
    const response = await apiClient.patch(`/shops/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateShopStatusInput) => {
    const response = await apiClient.patch(`/shops/${id}/status`, data);
    return response.data;
  },
};
