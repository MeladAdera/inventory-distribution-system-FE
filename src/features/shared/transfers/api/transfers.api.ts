import { apiClient } from '@/common/api';
import { ordersApi } from '@/features/shared/orders/api/orders.api';
import { ProductSource } from '@/features/shared/products/types/products.types';
import { ShopType } from '@/features/admin/shops/types/shops.types';
import type {
  TransferListParams,
  CreateTransferInput,
  UpdateTransferStatusInput,
} from '../types/transfers.types';

// There is no /transfers resource — this is the /orders API. The four core calls
// delegate to ordersApi so the endpoints live in one place; the two lookups below
// are admin-form helpers that ordersApi has no reason to carry.
export const transfersApi = {
  list: (params?: TransferListParams) => ordersApi.list(params),

  getById: (id: number) => ordersApi.getById(id),

  create: (data: CreateTransferInput) => ordersApi.create(data),

  updateStatus: (id: number, data: UpdateTransferStatusInput) => ordersApi.updateStatus(id, data),

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
