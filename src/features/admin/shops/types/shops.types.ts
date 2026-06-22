export enum ShopType {
  WAREHOUSE = 'WAREHOUSE',
  SHOP = 'SHOP',
}

export interface Shop {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  type: ShopType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: ShopType;
}

export interface UpdateShopInput {
  name?: string;
  address?: string;
  phone?: string;
}

export interface UpdateShopStatusInput {
  isActive: boolean;
}
