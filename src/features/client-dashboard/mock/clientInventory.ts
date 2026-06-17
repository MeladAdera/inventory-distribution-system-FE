import { StockStatus } from '@/features/products/types/products.types';

export interface ClientInventoryItem {
  id: number;
  nameAr: string;
  nameEn: string;
  qty: number;
  min: number;
  backStock: number;
  status: StockStatus;
}

export const CLIENT_INVENTORY: ClientInventoryItem[] = [
  {
    id: 1,
    nameAr: 'ماء معدني ٥٠٠ مل',
    nameEn: 'Mineral water 500ml',
    qty: 84,
    min: 40,
    backStock: 200,
    status: StockStatus.HIGH_STOCK,
  },
  {
    id: 2,
    nameAr: 'مشروب طاقة',
    nameEn: 'Energy drink',
    qty: 6,
    min: 20,
    backStock: 0,
    status: StockStatus.LOW_STOCK,
  },
  {
    id: 4,
    nameAr: 'حليب طويل الأمد ١ لتر',
    nameEn: 'Long-life milk 1L',
    qty: 120,
    min: 50,
    backStock: 60,
    status: StockStatus.HIGH_STOCK,
  },
  {
    id: 5,
    nameAr: 'جبنة شيدر ٢٠٠ غ',
    nameEn: 'Cheddar cheese 200g',
    qty: 28,
    min: 15,
    backStock: 40,
    status: StockStatus.HIGH_STOCK,
  },
  {
    id: 7,
    nameAr: 'صابون يدين',
    nameEn: 'Hand soap',
    qty: 6,
    min: 30,
    backStock: 0,
    status: StockStatus.LOW_STOCK,
  },
  {
    id: 8,
    nameAr: 'تونة معلبة',
    nameEn: 'Canned tuna',
    qty: 0,
    min: 25,
    backStock: 0,
    status: StockStatus.OUT_OF_STOCK,
  },
  {
    id: 10,
    nameAr: 'عصير برتقال ١ لتر',
    nameEn: 'Orange juice 1L',
    qty: 44,
    min: 24,
    backStock: 30,
    status: StockStatus.HIGH_STOCK,
  },
  {
    id: 12,
    nameAr: 'مناديل ورقية',
    nameEn: 'Paper tissues',
    qty: 9,
    min: 35,
    backStock: 12,
    status: StockStatus.LOW_STOCK,
  },
];

export const LOW_STOCK_ITEMS = CLIENT_INVENTORY.filter(
  (item) => item.status === StockStatus.LOW_STOCK || item.status === StockStatus.OUT_OF_STOCK
);
