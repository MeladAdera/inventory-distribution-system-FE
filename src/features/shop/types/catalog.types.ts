import type { Product } from '@/features/shared/products/types/products.types';

/**
 * Warehouse catalog item as seen by a shop caller.
 * GET /products?source=WAREHOUSE enriches each product with the caller's
 * own inventory status (fields absent for admin callers).
 */
export interface CatalogProduct extends Product {
  /** Does this shop already track the product in its inventory? */
  in_inventory: boolean;
  /** This shop's current stock for the product (0 if not tracked). */
  current_quantity: number;
}

export interface CatalogCategory {
  name: string;
  /** Lucide icon name from the products' category; null when unset. */
  icon: string | null;
  items: CatalogProduct[];
}
