import { StockStatus } from '@/features/products/types/products.types';

export interface OrderableProduct {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  price: string;
  current_quantity: number;
  status: StockStatus;
  image_url: string | null;
}

export interface OrderableCategory {
  id: number;
  name: string;
  image_url: string | null;
  products: OrderableProduct[];
}
