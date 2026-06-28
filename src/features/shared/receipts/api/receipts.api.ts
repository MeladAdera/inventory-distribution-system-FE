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

  create: async (data: CreateReceiptInput) => {
    const response = await apiClient.post('/receipts', data);
    return response.data;
  },
};
