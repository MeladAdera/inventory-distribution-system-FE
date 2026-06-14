export interface Transfer {
  id: number;
  date_ar: string;
  date_en: string;
  client_id: number;
  client_name_ar: string;
  client_name_en: string;
  product_id: number;
  product_name_ar: string;
  product_name_en: string;
  qty: number;
  notes_ar: string;
  notes_en: string;
  recorded_by_ar: string;
  recorded_by_en: string;
}

export interface TransferProduct {
  id: number;
  name_ar: string;
  name_en: string;
  available_qty: number;
  is_active: boolean;
}

export interface TransferClient {
  id: number;
  name_ar: string;
  name_en: string;
  status: 'active' | 'inactive';
}

export interface TransferPrefill {
  client_id?: number;
  product_id?: number;
  qty?: number;
}
