import type { DisplayStockStatus } from '@/features/shared/products/types/products.types';

export interface EnrichedInventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  barcode?: string;
  current_quantity: number;
  /** Catalog / list default price from the product (reference only; not the sale price). */
  price: string;
  /** Per-shop selling price — source of truth for a sale (2dp string). */
  sale_price: string;
  /** Moving-average cost basis (4dp string). '0' fallback until the backend value is present. */
  avg_cost: string;
  low_stock_threshold: number;
  is_low_stock: boolean;
  status: DisplayStockStatus;
  category_id: number;
  category_name: string;
  updated_at: string;
  image_url: string | null;
}

export interface InventoryCategory {
  id: string;
  name: string;
  icon: string | null;
  image_url: string | null;
  items: EnrichedInventoryItem[];
}

export type StockFilter = 'all' | 'low' | 'out';
