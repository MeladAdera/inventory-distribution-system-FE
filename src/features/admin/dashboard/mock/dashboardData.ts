export const CHART_DATA = {
  daily: [320, 280, 410, 360, 480, 520, 440, 390, 560, 610, 470, 530, 600, 680].map((v, i) => ({
    idx: i,
    value: v,
  })),
  weekly: [2400, 2780, 3120, 2950, 3480, 3920, 4100].map((v, i) => ({ idx: i, value: v })),
  monthly: [9800, 11200, 10400, 12600, 13800, 12900].map((v, i) => ({ idx: i, value: v })),
};

export const TOP_CONSUMED = [
  { nameAr: 'حليب طويل الأمد ١ لتر', nameEn: 'UHT Milk 1L', value: 1840 },
  { nameAr: 'ماء معدني ٥٠٠ مل', nameEn: 'Mineral Water 500ml', value: 1520 },
  { nameAr: 'تونة معلبة', nameEn: 'Canned Tuna', value: 1180 },
  { nameAr: 'عصير برتقال ١ لتر', nameEn: 'Orange Juice 1L', value: 940 },
  { nameAr: 'مشروب طاقة', nameEn: 'Energy Drink', value: 720 },
];

export type ShortageStatus = 'low' | 'out';

export interface ShortageRow {
  id: string;
  productAr: string;
  productEn: string;
  clientAr: string;
  clientEn: string;
  remaining: number;
  min: number;
  status: ShortageStatus;
}

export const SHORTAGES: ShortageRow[] = [
  {
    id: '1',
    productAr: 'صابون يدين',
    productEn: 'Hand Soap',
    clientAr: 'بقالة الواحة',
    clientEn: 'Al-Waha Grocery',
    remaining: 6,
    min: 30,
    status: 'low',
  },
  {
    id: '2',
    productAr: 'شيبس بطاطس',
    productEn: 'Potato Chips',
    clientAr: 'سوبرماركت النخيل',
    clientEn: 'Al-Nakhil Supermarket',
    remaining: 0,
    min: 25,
    status: 'out',
  },
  {
    id: '3',
    productAr: 'مشروب طاقة',
    productEn: 'Energy Drink',
    clientAr: 'كافتيريا الصفا',
    clientEn: 'Al-Safa Cafeteria',
    remaining: 4,
    min: 20,
    status: 'low',
  },
  {
    id: '4',
    productAr: 'خبز توست',
    productEn: 'Toast Bread',
    clientAr: 'مطعم البركة',
    clientEn: 'Al-Baraka Restaurant',
    remaining: 0,
    min: 15,
    status: 'out',
  },
  {
    id: '5',
    productAr: 'مناديل ورقية',
    productEn: 'Paper Tissues',
    clientAr: 'بقالة الريف',
    clientEn: 'Al-Reef Grocery',
    remaining: 9,
    min: 35,
    status: 'low',
  },
];

export type ActivityType = 'transfer' | 'consumption' | 'added' | 'adjust';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  textAr: string;
  textEn: string;
  timeAr: string;
  timeEn: string;
}

export const ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'transfer',
    textAr: 'تم نقل ١٢٠ وحدة من حليب طويل الأمد إلى سوبرماركت النخيل',
    textEn: '120 units of UHT Milk transferred to Al-Nakhil Supermarket',
    timeAr: 'منذ ١٠ دقائق',
    timeEn: '10 min ago',
  },
  {
    id: '2',
    type: 'consumption',
    textAr: 'سجّلت كافتيريا الصفا استهلاك ١٦ وحدة من مشروب طاقة',
    textEn: 'Al-Safa Cafeteria recorded 16 units of Energy Drink consumed',
    timeAr: 'منذ ٤٠ دقيقة',
    timeEn: '40 min ago',
  },
  {
    id: '3',
    type: 'added',
    textAr: 'تمت إضافة منتج جديد: مناديل ورقية',
    textEn: 'New product added: Paper Tissues',
    timeAr: 'منذ ساعتين',
    timeEn: '2 hours ago',
  },
  {
    id: '4',
    type: 'adjust',
    textAr: 'تم تعديل مخزون تونة معلبة في مطعم البركة',
    textEn: 'Canned Tuna stock adjusted at Al-Baraka Restaurant',
    timeAr: 'منذ ٣ ساعات',
    timeEn: '3 hours ago',
  },
  {
    id: '5',
    type: 'consumption',
    textAr: 'سجّلت بقالة الواحة استهلاك ٢٤ وحدة من صابون يدين',
    textEn: 'Al-Waha Grocery recorded 24 units of Hand Soap consumed',
    timeAr: 'أمس',
    timeEn: 'Yesterday',
  },
  {
    id: '6',
    type: 'transfer',
    textAr: 'تم نقل ٢٤٠ وحدة من ماء معدني إلى مطعم البركة',
    textEn: '240 units of Mineral Water transferred to Al-Baraka Restaurant',
    timeAr: 'أمس',
    timeEn: 'Yesterday',
  },
];
