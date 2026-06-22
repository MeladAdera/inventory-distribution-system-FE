import { apiClient } from '@/common/api';
import type {
  StockInInput,
  AdjustInventoryInput,
  InventoryListParams,
} from '../types/inventory.types';

export const inventoryApi = {
  list: async (params?: InventoryListParams) => {
    const response = await apiClient.get('/inventory', { params });
    return response.data;
  },

  getLowStock: async () => {
    const response = await apiClient.get('/inventory/low-stock');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/inventory/${id}`);
    return response.data;
  },

  stockIn: async (data: StockInInput) => {
    const response = await apiClient.post('/inventory/stock-in', data);
    return response.data;
  },

  adjust: async (id: number, data: AdjustInventoryInput) => {
    const response = await apiClient.patch(`/inventory/${id}`, data);
    return response.data;
  },
};
