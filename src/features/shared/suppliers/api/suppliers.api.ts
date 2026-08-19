import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/common/api/client';
import type {
  BillListParams,
  CreateBillInput,
  CreateSupplierInput,
  PaySupplierInput,
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
   * Record a bill against this supplier, optionally stocking the goods on it.
   *
   * 409 supplier.INVOICE_TAKEN if `invoiceNo` was already used for this same
   * supplier, and 400 supplier.PAID_EXCEEDS_TOTAL if more was paid than billed.
   *
   * With `items` there are more ways to be turned away, every one of them
   * rejecting the WHOLE request — no debt, no stock, no partial state, so the
   * same payload is safe to retry once corrected:
   *   400 the lines don't sum to `totalAmount` (the message names both figures)
   *   400 the same product appears on more than one line
   *   400 a line's unit price is not greater than zero (names the product)
   *   403 a line's product belongs to another shop
   *   404 a line's product doesn't exist (names the id)
   */
  recordBill: async (id: number, data: CreateBillInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post(`/suppliers/${id}/debts`, data, config);
    return response.data;
  },

  /**
   * The goods on one bill. Empty for a money-only bill.
   *
   * `avg_cost` and `sale_price` are read live rather than frozen at purchase
   * time, so this answers "what is this product costing me now?" rather than
   * "what did this delivery do to the average back then?".
   */
  billItems: async (id: number, debtId: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/suppliers/${id}/debts/${debtId}/items`, config);
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

  /**
   * Pay this supplier — one bill if `debtId` is given, oldest-first otherwise.
   *
   * Returns an ARRAY either way, one entry per bill the money touched; the
   * targeted form just returns a single-element one. 404
   * debt.NO_OPEN_SUPPLIER_DEBTS when there is nothing left to pay.
   */
  payBills: async (id: number, data: PaySupplierInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post(`/suppliers/${id}/payments`, data, config);
    return response.data;
  },
};
