import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/common/api/client';
import type {
  AssignEmployeesInput,
  CloseShiftInput,
  CreateShiftTemplateInput,
  OpenShiftInput,
  ShiftReportParams,
  ShiftSessionListParams,
  UpdateOpeningHoursInput,
  UpdateShiftTemplateInput,
} from '../types/shifts.types';

// Every /shifts endpoint is 403 for WAREHOUSE_ADMIN — the role has no shop.
// Owner-only endpoints are marked; the rest are open to employees too.
//
// Each call takes an optional AxiosRequestConfig so replayed offline-sync
// requests can pass { skipAuthRedirect: true }, matching receipts.api.ts.
export const shiftsApi = {
  // ── Opening hours ─────────────────────────────────────────────────────────

  /** Always 7 days, ordered 0–6, whether or not anything has been saved. */
  getOpeningHours: async (config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/shifts/opening-hours', config);
    return response.data;
  },

  /** Owner only. Send all 7 days every time — a partial save is rejected. */
  updateOpeningHours: async (data: UpdateOpeningHoursInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.put('/shifts/opening-hours', data, config);
    return response.data;
  },

  // ── Templates ─────────────────────────────────────────────────────────────

  /** The whole week, ordered by weekday then slot position. */
  getTemplates: async (config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/shifts/templates', config);
    return response.data;
  },

  /** Owner only. Never send slot_index — the server picks the lowest free 1–4. */
  createTemplate: async (data: CreateShiftTemplateInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post('/shifts/templates', data, config);
    return response.data;
  },

  /** Owner only. `weekday` cannot be changed; delete and recreate to move a slot. */
  updateTemplate: async (
    id: number,
    data: UpdateShiftTemplateInput,
    config?: AxiosRequestConfig
  ) => {
    const response = await apiClient.patch(`/shifts/templates/${id}`, data, config);
    return response.data;
  },

  /**
   * Owner only. Soft delete returning 204 — no body. The slot leaves the grid,
   * frees its position for reuse and drops its rota; past sessions keep naming it.
   */
  deleteTemplate: async (id: number, config?: AxiosRequestConfig): Promise<void> => {
    await apiClient.delete(`/shifts/templates/${id}`, config);
  },

  /**
   * Owner only. FULL REPLACE — send the complete roster; `[]` clears the slot.
   * Returns the template with its updated assignees. Rejects with
   * `shift.ASSIGNEE_NOT_EMPLOYEE` (naming the id) for anyone who is not an
   * active EMPLOYEE of this shop; the owner cannot be assigned.
   */
  assignEmployees: async (id: number, data: AssignEmployeesInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.put(`/shifts/templates/${id}/assignees`, data, config);
    return response.data;
  },

  // ── Sessions ──────────────────────────────────────────────────────────────

  /**
   * The shop's open shift, or null. Because one shop has one open shift, this
   * answers both "is anyone working?" and "am I working?" — compare `user_id`.
   */
  getOpen: async (config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/shifts/open', config);
    return response.data;
  },

  /**
   * Start a shift. Do NOT send a template id — the server works out which slot
   * is running from the shop clock. 409 `shift.SESSION_ALREADY_OPEN`, naming the
   * person, when someone else's shift is still open.
   */
  open: async (data: OpenShiftInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post('/shifts/open', data, config);
    return response.data;
  },

  /**
   * Close a shift and freeze its cash figures. Anyone in the shop may close any
   * shift. Returns the same shape as a read, now populated.
   */
  close: async (id: number, data: CloseShiftInput, config?: AxiosRequestConfig) => {
    const response = await apiClient.post(`/shifts/${id}/close`, data, config);
    return response.data;
  },

  /** Owner only. Paginated, newest trading day first. */
  getSessions: async (params?: ShiftSessionListParams, config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/shifts/sessions', { ...config, params });
    return response.data;
  },

  /**
   * One shift with the receipts behind it. An owner sees any; an employee sees
   * only shifts they worked (403 `shift.SESSION_ACCESS_DENIED` otherwise).
   */
  getSessionById: async (id: number, config?: AxiosRequestConfig) => {
    const response = await apiClient.get(`/shifts/sessions/${id}`, config);
    return response.data;
  },

  /** Owner only. Totals grouped by employee and by shift slot. */
  getReport: async (params?: ShiftReportParams, config?: AxiosRequestConfig) => {
    const response = await apiClient.get('/shifts/report', { ...config, params });
    return response.data;
  },
};
