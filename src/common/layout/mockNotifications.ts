export type NotifType = 'out' | 'low' | 'request' | 'done';

export interface MockNotification {
  id: string;
  type: NotifType;
  text: Record<'ar' | 'en', string>;
  time: Record<'ar' | 'en', string>;
  unread: boolean;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: '1',
    type: 'out',
    text: { ar: 'نفاد مخزون منتج الأرز', en: 'Rice product is out of stock' },
    time: { ar: 'منذ 5 دقائق', en: '5 minutes ago' },
    unread: true,
  },
  {
    id: '2',
    type: 'low',
    text: { ar: 'مخزون السكر منخفض (12 كيس)', en: 'Sugar stock is low (12 bags)' },
    time: { ar: 'منذ 20 دقيقة', en: '20 minutes ago' },
    unread: true,
  },
  {
    id: '3',
    type: 'request',
    text: { ar: 'طلب نقل من فرع الرياض', en: 'Transfer request from Riyadh branch' },
    time: { ar: 'منذ ساعة', en: '1 hour ago' },
    unread: true,
  },
  {
    id: '4',
    type: 'done',
    text: { ar: 'اكتمال شحنة الزيت بنجاح', en: 'Oil shipment completed successfully' },
    time: { ar: 'منذ 3 ساعات', en: '3 hours ago' },
    unread: false,
  },
];
