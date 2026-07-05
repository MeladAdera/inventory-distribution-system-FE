import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/common/api';
import type { CreateReceiptInput, ReceiptListParams } from '../types/receipts.types';

export const receiptsApi = {
  list: async (params?: ReceiptListParams) => {
    const response = await apiClient.get('/receipts', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/receipts/${id}`);
    return response.data;
  },

  create: async (data: CreateReceiptInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post('/receipts', data, config);
    return response.data;
  },
};
