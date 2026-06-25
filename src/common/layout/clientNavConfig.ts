import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface ClientNavItem {
  id: 'dashboard' | 'inventory' | 'order' | 'orders' | 'settings';
  href: string;
  icon: LucideIcon;
}

export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { id: 'dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { id: 'inventory', href: '/client/inventory', icon: Package },
  { id: 'order', href: '/client/order', icon: ShoppingCart },
  { id: 'orders', href: '/client/orders', icon: ClipboardList },
  { id: 'settings', href: '/client/settings', icon: Settings },
];

/** First 3 items shown as tabs in the mobile bottom bar. The rest go in the More sheet. */
export const CLIENT_NAV_PRIMARY = CLIENT_NAV_ITEMS.slice(0, 3);
export const CLIENT_NAV_OVERFLOW = CLIENT_NAV_ITEMS.slice(3);
