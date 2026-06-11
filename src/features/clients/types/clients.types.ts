export type ClientStatus = 'active' | 'inactive';

export interface AdminClient {
  id: number;
  name_ar: string;
  name_en: string;
  phone: string;
  city_ar: string;
  city_en: string;
  product_count: number;
  last_activity_ar: string;
  last_activity_en: string;
  status: ClientStatus;
  notes?: string;
}
