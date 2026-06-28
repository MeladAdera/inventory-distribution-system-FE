import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Users,
  Settings,
  ScrollText,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

export interface ClientNavItem {
  id:
    | 'dashboard'
    | 'inventory'
    | 'order'
    | 'orders'
    | 'receipts'
    | 'employees'
    | 'settings'
    | 'auditLogs';
  href: string;
  icon: LucideIcon;
}

export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { id: 'dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { id: 'inventory', href: '/client/inventory', icon: Package },
  { id: 'order', href: '/client/order', icon: ShoppingCart },
  { id: 'orders', href: '/client/orders', icon: ClipboardList },
  { id: 'receipts', href: '/client/receipts', icon: Receipt },
  { id: 'employees', href: '/client/employees', icon: Users },
  { id: 'auditLogs', href: '/client/audit-logs', icon: ScrollText },
  { id: 'settings', href: '/client/settings', icon: Settings },
];

/** First 3 items shown as tabs in the mobile bottom bar. The rest go in the More sheet. */
export const CLIENT_NAV_PRIMARY = CLIENT_NAV_ITEMS.slice(0, 3);
export const CLIENT_NAV_OVERFLOW = CLIENT_NAV_ITEMS.slice(3);
