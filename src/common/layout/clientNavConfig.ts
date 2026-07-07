import {
  LayoutDashboard,
  LayoutGrid,
  TrendingUp,
  Package,
  ShoppingCart,
  ClipboardList,
  Users,
  Settings,
  ScrollText,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@/features/auth/types/enums';

export interface ClientNavItem {
  id:
    | 'dashboard'
    | 'profit'
    | 'inventory'
    | 'order'
    | 'sell'
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
  { id: 'sell', href: '/client/sell', icon: LayoutGrid },
  { id: 'orders', href: '/client/orders', icon: ClipboardList },
  { id: 'profit', href: '/client/profit', icon: TrendingUp },
  { id: 'receipts', href: '/client/receipts', icon: Receipt },
  { id: 'employees', href: '/client/employees', icon: Users },
  { id: 'auditLogs', href: '/client/audit-logs', icon: ScrollText },
  { id: 'settings', href: '/client/settings', icon: Settings },
];

// EMPLOYEE only sees dashboard + inventory + sell; mirrors EMPLOYEE_ALLOWED_ROUTES in middleware.utils.ts
const EMPLOYEE_NAV_IDS: ClientNavItem['id'][] = ['dashboard', 'inventory', 'sell'];

export function getClientNavItems(role?: UserRole): ClientNavItem[] {
  if (role === UserRole.EMPLOYEE) {
    return CLIENT_NAV_ITEMS.filter((item) => EMPLOYEE_NAV_IDS.includes(item.id));
  }
  return CLIENT_NAV_ITEMS;
}
