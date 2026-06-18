import { StockStatus } from '@/features/products/types/products.types';

export interface OrderableProduct {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  price: string;
  current_quantity: number;
  status: StockStatus;
}

export interface OrderableCategory {
  id: number;
  name: string;
  products: OrderableProduct[];
}
