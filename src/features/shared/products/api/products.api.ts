import { apiClient } from '@/common/api';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductListParams,
  ProductDetail,
} from '../types/products.types';
import type { ApiResponse } from '@/common/types/api.types';

export const productsApi = {
  list: async (params?: ProductListParams) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<ProductDetail>> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductInput, shop_id?: number) => {
    const response = await apiClient.post('/products', data, {
      params: shop_id ? { shop_id } : undefined,
    });
    return response.data;
  },

  update: async (id: number, data: UpdateProductInput) => {
    const response = await apiClient.patch(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  uploadImage: async (id: number, file: File) => {
    const form = new FormData();
    form.append('image', file);
    const response = await apiClient.patch(`/products/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteImage: async (id: number) => {
    const response = await apiClient.delete(`/products/${id}/image`);
    return response.data;
  },
};
