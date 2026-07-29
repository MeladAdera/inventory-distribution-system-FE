import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/common/api/client';
import type {
  CreateCustomerInput,
  CustomerListParams,
  UpdateCustomerInput,
} from '../types/customers.types';
import type { RecordPaymentInput } from '@/features/shared/debts/types/debts.types';

/**
 * Body for POST /customers/:id/payments. Without `debtId` the amount is applied
 * to this customer's oldest debts first (FIFO) and may settle several at once.
 */
export interface CollectPaymentInput extends RecordPaymentInput {
  debtId?: number;
}

// Each call takes an optional AxiosRequestConfig so replayed offline-sync
// requests can pass { skipAuthRedirect: true }, matching receipts.api.ts.
export const customersApi = {
  list: async (params?: CustomerListParams, config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/customers', { ...config, params });
    return response.data;
  },

  getById: async (id: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/customers/${id}`, config);
    return response.data;
  },

  create: async (data: CreateCustomerInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post('/customers', data, config);
    return response.data;
  },

  update: async (id: number, data: UpdateCustomerInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.patch(`/customers/${id}`, data, config);
    return response.data;
  },

  /** Soft delete. 400 customer.HAS_OPEN_DEBT if money is owed in either direction. */
  deactivate: async (id: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.delete(`/customers/${id}`, config);
    return response.data;
  },

  /** Paginated, same envelope as GET /debts. */
  debts: async (
    id: number,
    params?: { page?: number; limit?: number },
    config?: AxiosRequestConfig
  ) => {
    const response = await apiClient.get(`/customers/${id}/debts`, { ...config, params });
    return response.data;
  },

  summary: async (id: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/customers/${id}/summary`, config);
    return response.data;
  },

  /** Returns an ARRAY — one entry per debt the payment touched. */
  collectPayment: async (id: number, data: CollectPaymentInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post(`/customers/${id}/payments`, data, config);
    return response.data;
  },
};
