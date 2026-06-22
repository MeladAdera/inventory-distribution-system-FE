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
