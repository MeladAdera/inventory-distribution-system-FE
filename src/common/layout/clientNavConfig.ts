import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Tag,
  Box,
  type LucideIcon,
} from 'lucide-react';

export interface ClientNavItem {
  id: 'dashboard' | 'inventory' | 'order' | 'orders' | 'categories' | 'products';
  href: string;
  icon: LucideIcon;
}

export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { id: 'dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { id: 'inventory', href: '/client/inventory', icon: Package },
  { id: 'order', href: '/client/order', icon: ShoppingCart },
  { id: 'orders', href: '/client/orders', icon: ClipboardList },
  { id: 'categories', href: '/client/categories', icon: Tag },
  { id: 'products', href: '/client/products', icon: Box },
];

/** First 3 items shown as tabs in the mobile bottom bar. The rest go in the More sheet. */
export const CLIENT_NAV_PRIMARY = CLIENT_NAV_ITEMS.slice(0, 3);
export const CLIENT_NAV_OVERFLOW = CLIENT_NAV_ITEMS.slice(3);
