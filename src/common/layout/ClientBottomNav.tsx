'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { CLIENT_NAV_ITEMS } from './clientNavConfig';

export function ClientBottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const nav = t.client.nav as Record<string, string>;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-border h-14 flex items-stretch">
      {CLIENT_NAV_ITEMS.map((item) => {
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
    </nav>
  );
}
