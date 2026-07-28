import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/common/api/client';
import type {
  DebtListParams,
  ReceivablesParams,
  RecordPaymentInput,
  ReversePaymentInput,
} from '../types/debts.types';

// Read/manage endpoints that serve BOTH flows — the same debt object whether it
// came from an order (warehouse → shop) or a receipt (shop → customer).
//
// Visibility is enforced server-side no matter what is sent: an admin sees
// everything, a shop owner only debts their shop is a party to, and an employee
// only CUSTOMER debts. So `?debtorType=SHOP` as an employee returns an empty
// list rather than an error — no client-side special-casing needed.
//
// Note on agingBucket: the value `60+` must arrive URL-encoded as `60%2B`,
// because a raw `+` decodes to a space and silently matches nothing. Axios's
// default param serializer encodes it correctly; don't hand-build these URLs.
export const debtsApi = {
  list: async (params?: DebtListParams, config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/debts', { ...config, params });
    return response.data;
  },

  summary: async (params?: ReceivablesParams, config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/debts/summary', { ...config, params });
    return response.data;
  },

  getById: async (id: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/debts/${id}`, config);
    return response.data;
  },

  /** Full ledger for one debt, including reversal rows (negative amounts). */
  payments: async (id: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/debts/${id}/payments`, config);
    return response.data;
  },

  /**
   * Appends a negative entry rather than deleting the original, so history keeps
   * both. Permission depends on which side the debt is: admin for order-debts,
   * the owning shop owner for customer-debts. Employees get 403 either way.
   */
  reversePayment: async (
    debtId: number,
    paymentId: number,
    data: ReversePaymentInput,
    config?: AxiosRequestConfig
  ) => {
    const response = await apiClient.post(
      `/debts/${debtId}/payments/${paymentId}/reverse`,
      data,
      config
    );
    return response.data;
  },

  /**
   * The debt attached to an order. Returns 404 when the order hasn't shipped or
   * was paid in full — that means "nothing owed", not an error state.
   */
  getOrderDebt: async (orderId: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/orders/${orderId}/debt`, config);
    return response.data;
  },

  /** Record money the warehouse received from a shop. Admin only. */
  recordOrderPayment: async (
    orderId: number,
    data: RecordPaymentInput,
    config?: AxiosRequestConfig
  ) => {
    const response = await apiClient.post(`/orders/${orderId}/payments`, data, config);
    return response.data;
  },

  /** Both sides of one shop's ledger — what it owes, and what it is owed. */
  shopSummary: async (shopId: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/shops/${shopId}/debts/summary`, config);
    return response.data;
  },

  receivables: async (params?: ReceivablesParams, config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/analytics/receivables', { ...config, params });
    return response.data;
  },

  /** Always exactly 3 buckets, even at count 0. */
  receivablesAging: async (params?: ReceivablesParams, config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/analytics/receivables/aging', { ...config, params });
    return response.data;
  },
};
