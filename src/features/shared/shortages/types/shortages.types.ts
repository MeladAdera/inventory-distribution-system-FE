export type ShortageStatus = 'low' | 'out';

export interface Shortage {
  id: number;
  client_id: number;
  client_name_ar: string;
  client_name_en: string;
  product_id: number;
  product_name_ar: string;
  product_name_en: string;
  remaining: number;
  min_level: number;
  status: ShortageStatus;
  suggested: number;
}

export interface ShortageClient {
  id: number;
  name_ar: string;
  name_en: string;
}
