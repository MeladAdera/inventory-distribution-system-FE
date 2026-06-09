import { apiClient } from '@/common/api';
import type { CreateProductInput, UpdateProductInput } from '../types/products.types';

export const productsApi = {
  list: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductInput) => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductInput) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};
