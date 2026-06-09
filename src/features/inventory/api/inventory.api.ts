import { apiClient } from '@/common/api';
import type { CreateInventoryInput, UpdateInventoryInput } from '../types/inventory.types';

export const inventoryApi = {
  list: async () => {
    const response = await apiClient.get('/inventory');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/inventory/${id}`);
    return response.data;
  },

  create: async (data: CreateInventoryInput) => {
    const response = await apiClient.post('/inventory', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInventoryInput) => {
    const response = await apiClient.put(`/inventory/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/inventory/${id}`);
    return response.data;
  },
};
