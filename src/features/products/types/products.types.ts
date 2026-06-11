// ── Backend API types ──────────────────────────────────────────────────────

export enum ProductSource {
  WAREHOUSE = 'WAREHOUSE',
  LOCAL = 'LOCAL',
}

export interface Product {
  id: number;
  shop_id: number;
  category_id: number;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  source: ProductSource;
  is_global: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  source?: ProductSource;
  category_id?: number;
  shop_id?: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  barcode?: string;
  price: number;
  category_id: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
}

// ── Admin UI types ─────────────────────────────────────────────────────────

export type ProductCategory = 'bev' | 'snk' | 'dry' | 'cln' | 'can' | 'bky';
export type ProductStatus = 'in_stock' | 'low' | 'out' | 'inactive';

export interface AdminProduct {
  id: number;
  name_ar: string;
  name_en: string;
  sku: string;
  category: ProductCategory;
  warehouse_qty: number;
  cost_price: number;
  sell_price: number;
  min_stock: number;
  color: string;
  is_active: boolean;
  description?: string;
}

export function getProductStatus(product: AdminProduct): ProductStatus {
  if (!product.is_active) return 'inactive';
  if (product.warehouse_qty === 0) return 'out';
  if (product.warehouse_qty <= product.min_stock) return 'low';
  return 'in_stock';
}

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  bev: '#FAEACB',
  snk: '#F8EBD3',
  dry: '#DDE6F3',
  cln: '#DCEBE9',
  can: '#F6DDDB',
  bky: '#F5EFE4',
};
