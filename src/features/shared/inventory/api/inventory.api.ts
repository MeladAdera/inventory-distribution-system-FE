import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/common/api';
import type {
  StockInInput,
  AddInventoryInput,
  AdjustInventoryInput,
  InventoryListParams,
  UpdateSalePriceInput,
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

  // Shop-scoped (SHOP_OWNER / EMPLOYEE): registers a product on the caller's shop
  // inventory without moving stock. Idempotent — POSTing an already-tracked product
  // returns the existing row. 403 when the product isn't available to this shop.
  add: async (data: AddInventoryInput) => {
    const response = await apiClient.post('/inventory', data);
    return response.data;
  },

  stockIn: async (data: StockInInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post('/inventory/stock-in', data, config);
    return response.data;
  },

  adjust: async (id: number, data: AdjustInventoryInput) => {
    const response = await apiClient.patch(`/inventory/${id}`, data);
    return response.data;
  },

  // Shop-owner scoped: sets the per-shop selling price on this inventory row.
  // 403 if the row isn't the caller's shop.
  updateSalePrice: async (id: number, data: UpdateSalePriceInput) => {
    const response = await apiClient.patch(`/inventory/${id}/price`, data);
    return response.data;
  },
};
