import { apiClient } from '@/common/api';
import type {
  CategoryListParams,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/categories.types';

export const categoriesApi = {
  list: async (params?: CategoryListParams) => {
    const response = await apiClient.get('/categories', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryInput, shopId?: number) => {
    const response = await apiClient.post('/categories', data, {
      params: shopId !== undefined ? { shopId } : undefined,
    });
    return response.data;
  },

  update: async (id: number, data: UpdateCategoryInput) => {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },

  uploadImage: async (id: number, file: File) => {
    const form = new FormData();
    form.append('image', file);
    const response = await apiClient.patch(`/categories/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteImage: async (id: number) => {
    const response = await apiClient.delete(`/categories/${id}/image`);
    return response.data;
  },
};
