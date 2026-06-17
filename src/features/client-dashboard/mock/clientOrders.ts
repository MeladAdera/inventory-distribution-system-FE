export type OrderStatus = 'processing' | 'shipped' | 'received';

export interface OrderItem {
  productId: number;
  nameAr: string;
  nameEn: string;
  qty: number;
}

export interface ClientOrder {
  id: number;
  date: string; // ISO date string
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
}

export const CLIENT_ORDERS: ClientOrder[] = [
  {
    id: 1042,
    date: '2026-05-28',
    status: 'processing',
    items: [
      { productId: 2, nameAr: 'مشروب طاقة', nameEn: 'Energy drink', qty: 40 },
      { productId: 7, nameAr: 'صابون يدين', nameEn: 'Hand soap', qty: 50 },
      { productId: 8, nameAr: 'تونة معلبة', nameEn: 'Canned tuna', qty: 60 },
    ],
    notes: 'يرجى التوصيل صباحاً',
  },
  {
    id: 1041,
    date: '2026-05-25',
    status: 'shipped',
    items: [
      { productId: 1, nameAr: 'ماء معدني ٥٠٠ مل', nameEn: 'Mineral water 500ml', qty: 200 },
      { productId: 4, nameAr: 'حليب طويل الأمد ١ لتر', nameEn: 'Long-life milk 1L', qty: 120 },
    ],
  },
  {
    id: 1040,
    date: '2026-05-20',
    status: 'received',
    items: [
      { productId: 5, nameAr: 'جبنة شيدر ٢٠٠ غ', nameEn: 'Cheddar cheese 200g', qty: 30 },
      { productId: 10, nameAr: 'عصير برتقال ١ لتر', nameEn: 'Orange juice 1L', qty: 48 },
      { productId: 12, nameAr: 'مناديل ورقية', nameEn: 'Paper tissues', qty: 60 },
      { productId: 1, nameAr: 'ماء معدني ٥٠٠ مل', nameEn: 'Mineral water 500ml', qty: 300 },
      { productId: 8, nameAr: 'تونة معلبة', nameEn: 'Canned tuna', qty: 80 },
    ],
    notes: 'الطلب الشهري',
  },
];
