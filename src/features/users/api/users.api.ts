import { apiClient } from '@/common/api';
import type {
  CreateShopOwnerInput,
  CreateEmployeeInput,
  UpdateUserInput,
  UserListParams,
} from '../types/users.types';

export const usersApi = {
  list: async (params?: UserListParams) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  createShopOwner: async (data: CreateShopOwnerInput) => {
    const response = await apiClient.post('/users/shop-owners', data);
    return response.data;
  },

  createEmployee: async (data: CreateEmployeeInput) => {
    const response = await apiClient.post('/users/employees', data);
    return response.data;
  },

  update: async (id: number, data: UpdateUserInput) => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  deactivate: async (id: number) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};
