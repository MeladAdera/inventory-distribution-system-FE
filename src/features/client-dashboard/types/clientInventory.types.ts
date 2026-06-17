import { StockStatus } from '@/features/products/types/products.types';

export interface EnrichedInventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  barcode?: string;
  current_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  status: StockStatus;
  category_id: number;
  category_name: string;
  updated_at: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  items: EnrichedInventoryItem[];
}

export type StockFilter = 'all' | 'low' | 'out';
