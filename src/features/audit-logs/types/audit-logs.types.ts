export interface AuditLog {
  id: number;
  shop_id: number;
  user_id: number;
  type: string;
  action: string;
  entity_type: string;
  entity_id: number;
  quantity: number | null;
  amount: number | null;
  notes: string | null;
  created_at: string;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  shopId?: number;
  userId?: number;
  type?: string;
  action?: string;
  entityType?: string;
  entityId?: number;
  fromDate?: string;
  toDate?: string;
}
