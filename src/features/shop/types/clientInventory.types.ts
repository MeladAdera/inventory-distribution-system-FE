import { StockStatus } from '@/features/shared/products/types/products.types';

export interface EnrichedInventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  barcode?: string;
  current_quantity: number;
  price: string;
  low_stock_threshold: number;
  is_low_stock: boolean;
  status: StockStatus;
  category_id: number;
  category_name: string;
  updated_at: string;
  image_url: string | null;
}

export interface InventoryCategory {
  id: string;
  name: string;
  image_url: string | null;
  items: EnrichedInventoryItem[];
}

export type StockFilter = 'all' | 'low' | 'out';
