export enum AuditLogType {
  INVENTORY = 'INVENTORY',
  ORDER = 'ORDER',
}

export enum AuditLogAction {
  STOCK_IN = 'STOCK_IN',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

export interface AuditLog {
  id: number;
  shop_id: number | null;
  shop_name: string | null;
  user_id: number;
  user_name: string;
  type: AuditLogType;
  action: AuditLogAction;
  entity_type: string;
  entity_id: number;
  quantity: number | null;
  amount: number | null;
  notes: string | null;
  created_at: string;
}

export interface AuditLogDetail extends AuditLog {
  product_name: string | null;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  shopId?: number;
  userId?: number;
  type?: AuditLogType;
  action?: AuditLogAction;
  entityType?: string;
  entityId?: number;
  fromDate?: string;
  toDate?: string;
}
