import { ProductSource } from '@/features/auth/types/enums';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  source: ProductSource;
  category: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  sku: string;
  price: number;
  source: ProductSource;
  category: string;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
}
