import { apiClient } from '@/common/api';
import { ProductSource } from '@/features/products/types/products.types';
import { ShopType } from '@/features/shops/types/shops.types';
import type {
  TransferListParams,
  CreateTransferInput,
  UpdateTransferStatusInput,
} from '../types/transfers.types';

export const transfersApi = {
  list: async (params?: TransferListParams) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateTransferInput) => {
    const body: { items: { productId: number; quantity: number }[]; shopId?: number } = {
      items: [{ productId: data.productId, quantity: data.quantity }],
    };
    if (data.shopId) body.shopId = data.shopId;
    const response = await apiClient.post('/orders', body);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateTransferStatusInput) => {
    const response = await apiClient.patch(`/orders/${id}/status`, data);
    return response.data;
  },

  getShops: async () => {
    const response = await apiClient.get('/shops', {
      params: { type: ShopType.SHOP, limit: 100 },
    });
    return response.data;
  },

  getProducts: async () => {
    const response = await apiClient.get('/products', {
      params: { source: ProductSource.WAREHOUSE, limit: 100 },
    });
    return response.data;
  },
};
