import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';

export interface ClientNavItem {
  id: 'dashboard' | 'inventory' | 'order' | 'orders';
  href: string;
  icon: LucideIcon;
}

export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { id: 'dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { id: 'inventory', href: '/client/inventory', icon: Package },
  { id: 'order', href: '/client/order', icon: ShoppingCart },
  { id: 'orders', href: '/client/orders', icon: ClipboardList },
];
