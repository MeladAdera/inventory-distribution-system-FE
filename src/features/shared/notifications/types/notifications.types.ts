export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS = 'ORDER_STATUS',
}

export interface Notification {
  id: number;
  shop_id: number;
  user_id: number | null;
  title: string;
  message: string;
  type: NotificationType;
  args: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}
