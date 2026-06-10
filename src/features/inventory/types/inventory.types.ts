export interface InventoryItem {
  id: number;
  shop_id: number;
  product_id: number;
  current_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
  product_name?: string;
  is_low_stock?: boolean;
}

export interface InventoryListParams {
  page?: number;
  limit?: number;
  lowStock?: boolean;
  productId?: number;
}

export interface StockInInput {
  productId: number;
  quantity: number;
  notes?: string;
}

export interface AdjustInventoryInput {
  adjustment: number;
  reason?: string;
}
