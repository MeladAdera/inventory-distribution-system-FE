export enum ProductSource {
  WAREHOUSE = 'WAREHOUSE',
  LOCAL = 'LOCAL',
}

export enum StockStatus {
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  HIGH_STOCK = 'HIGH_STOCK',
}

export interface Product {
  id: number;
  shop_id: number;
  shop_name: string;
  category_id: number;
  category_name: string;
  /** Lucide icon name of the product's category; null when uncategorized. */
  category_icon: string | null;
  name: string;
  description: string | null;
  barcode: string | null;
  price: string;
  /** Buying price. `null` when hidden (shop users viewing warehouse products). */
  cost_price: string | null;
  source: ProductSource;
  is_global: boolean;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductDetail extends Product {
  current_quantity: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  source?: ProductSource;
  category_name?: string;
  shop_id?: number;
  shop_name?: string;
  is_active?: boolean;
  stock_status?: StockStatus;
  search?: string; // case-insensitive, matches name or barcode
}

export interface CreateProductInput {
  name: string;
  description?: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  category_id: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  barcode?: string;
  price?: number;
  cost_price?: number;
  category_id?: number;
}
