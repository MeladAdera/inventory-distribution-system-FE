'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, TrendingDown, Menu } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';

const NAV_ITEMS = [
  { id: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'products', href: '/products', icon: Package },
  { id: 'clients', href: '/clients', icon: Users },
  { id: 'shortages', href: '/shortages', icon: TrendingDown },
] as const;

interface BottomNavProps {
  onMoreClick?: () => void;
}

export function BottomNav({ onMoreClick }: BottomNavProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const nav = t.bottomnav.nav as Record<string, string>;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-border h-14 flex items-stretch">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              active ? 'text-amber-700' : 'text-ink-400 hover:text-ink-700'
            )}
          >
            <Icon size={20} />
            <span>{nav[item.id] ?? item.id}</span>
          </Link>
        );
      })}

      <button
        onClick={onMoreClick}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-ink-400 hover:text-ink-700 transition-colors"
      >
        <Menu size={20} />
        <span>{nav['more'] ?? 'More'}</span>
      </button>
    </nav>
  );
}
