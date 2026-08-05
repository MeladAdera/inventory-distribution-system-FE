import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/common/api/client';
import type {
  BillListParams,
  CreateBillInput,
  CreateSupplierInput,
  SupplierListParams,
  UpdateSupplierInput,
} from '../types/suppliers.types';

// Every route here is ADMIN or OWNER only — an EMPLOYEE gets 403 on all of them,
// which is why /client/suppliers is kept out of both the employee nav and the
// middleware allowlist rather than letting them discover the error.
export const suppliersApi = {
  list: async (params?: SupplierListParams, config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/suppliers', { ...config, params });
    return response.data;
  },

  getById: async (id: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/suppliers/${id}`, config);
    return response.data;
  },

  /** 409 supplier.PHONE_TAKEN if another active supplier in this shop has the number. */
  create: async (data: CreateSupplierInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post('/suppliers', data, config);
    return response.data;
  },

  update: async (id: number, data: UpdateSupplierInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.patch(`/suppliers/${id}`, data, config);
    return response.data;
  },

  /** Soft delete. 400 supplier.HAS_OPEN_DEBT if the shop still owes them. */
  deactivate: async (id: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.delete(`/suppliers/${id}`, config);
    return response.data;
  },

  /**
   * Record a bill against this supplier.
   *
   * 409 supplier.INVOICE_TAKEN if `invoiceNo` was already used for this same
   * supplier, and 400 supplier.PAID_EXCEEDS_TOTAL if more was paid than billed.
   */
  recordBill: async (id: number, data: CreateBillInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post(`/suppliers/${id}/debts`, data, config);
    return response.data;
  },

  /** This supplier's bills. Paginated, same envelope as GET /debts. */
  bills: async (id: number, params?: BillListParams, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/suppliers/${id}/debts`, { ...config, params });
    return response.data;
  },

  summary: async (id: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/suppliers/${id}/summary`, config);
    return response.data;
  },
};
