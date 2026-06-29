export interface TopProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
}

export type TrendPeriod = 'daily' | 'weekly' | 'monthly';

export interface TrendPoint {
  label: string;
  value: number;
}

export interface ShopConsumptionItem {
  product_id: number;
  product_name: string;
  quantity: number;
}

export interface ShopConsumptionParams {
  period?: TrendPeriod;
  shopId?: number;
  page?: number;
  limit?: number;
}
