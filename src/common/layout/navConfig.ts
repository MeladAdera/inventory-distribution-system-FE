import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  TrendingDown,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeVariant?: 'neutral' | 'danger';
  section: 'main' | 'manage';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'main' },
  { id: 'products', href: '/products', icon: Package, section: 'main' },
  { id: 'clients', href: '/clients', icon: Users, section: 'main' },
  {
    id: 'transfers',
    href: '/transfers',
    icon: Truck,
    section: 'main',
    badge: 8,
    badgeVariant: 'neutral',
  },
  {
    id: 'shortages',
    href: '/shortages',
    icon: TrendingDown,
    section: 'main',
    badge: 5,
    badgeVariant: 'danger',
  },
  { id: 'settings', href: '/settings', icon: Settings, section: 'manage' },
];

export const NAV_MAIN = NAV_ITEMS.filter((i) => i.section === 'main');
export const NAV_MANAGE = NAV_ITEMS.filter((i) => i.section === 'manage');
