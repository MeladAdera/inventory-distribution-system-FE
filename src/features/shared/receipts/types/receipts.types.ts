export interface ReceiptItem {
  id: number;
  inventory_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: string;
  quantity_before: number;
  quantity_after: number;
}

export interface Receipt {
  id: number;
  shop_id: number;
  created_by: number;
  notes: string | null;
  is_free: boolean;
  created_at: string;
  total_price: number;
  items: ReceiptItem[];
}

export interface ReceiptListItem {
  id: number;
  shop_id: number;
  shop_name: string;
  created_by: number;
  created_by_name: string;
  total_items: number;
  notes: string | null;
  is_free: boolean;
  created_at: string;
}

export interface CreateReceiptItem {
  inventoryId: number;
  quantity: number;
}

export interface CreateReceiptInput {
  items: CreateReceiptItem[];
  notes?: string;
}

export interface ReceiptListParams {
  page?: number;
  limit?: number;
  shopId?: number;
  createdBy?: number;
  fromDate?: string;
  toDate?: string;
}
