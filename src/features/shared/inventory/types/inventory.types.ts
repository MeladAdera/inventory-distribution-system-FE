export interface InventoryItem {
  id: number;
  shop_id: number;
  product_id: number;
  current_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
  product_name?: string;
  is_low_stock?: boolean;
  /** Moving-average cost basis for this (shop, product) row. DECIMAL string, 4dp (e.g. "6.0000"). */
  avg_cost?: string;
  /** Per-shop selling price (source of truth for a sale). DECIMAL string, 2dp (e.g. "25.00").
   *  Distinct from the catalog default on the product; edited via PATCH /inventory/:id/price. */
  sale_price?: string;
}

export interface InventoryListParams {
  page?: number;
  limit?: number;
  lowStock?: boolean;
  productId?: number;
  shop_id?: number;
}

export interface StockInInput {
  productId: number;
  quantity: number;
  /**
   * Unit cost for THIS batch, blended into the row's moving average by the backend.
   * Tri-state — the KEY must be omitted (never `null`/`""`) to invoke the inherit/seed rule:
   *   omit → cost inherited (avg unchanged; new row seeds from product cost)
   *   0    → genuinely free stock (lowers the basis)
   *   > 0  → blended into the average
   */
  unitCost?: number;
  notes?: string;
}

export interface AdjustInventoryInput {
  adjustment: number;
  reason?: string;
}

export interface AddInventoryInput {
  productId: number;
  /** Optional opening balance; omit for a plain "track this product" add (starts at 0). */
  quantity?: number;
}

export interface UpdateSalePriceInput {
  salePrice: number;
}
