'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/features/auth';
import { getClientNavItems } from './clientNavConfig';

interface ClientBottomNavProps {
  onMoreClick: () => void;
}

export function ClientBottomNav({ onMoreClick }: ClientBottomNavProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { user } = useAuth();
  const nav = t.client.nav as Record<string, string>;

  const navItems = getClientNavItems(user?.role);
  const primaryItems = navItems.slice(0, 3);
  const overflowItems = navItems.slice(3);

  const overflowActive = overflowItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-border h-14 flex items-stretch">
      {primaryItems.map((item) => {
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

      {overflowItems.length > 0 && (
        <button
          onClick={onMoreClick}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
            overflowActive ? 'text-amber-700' : 'text-ink-400 hover:text-ink-700'
          )}
        >
          <Menu size={20} />
          <span>{nav['more'] ?? 'More'}</span>
        </button>
      )}
    </nav>
  );
}
