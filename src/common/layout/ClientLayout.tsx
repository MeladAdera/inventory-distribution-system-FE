'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClientSidebar } from './ClientSidebar';
import { ClientTopBar } from './ClientTopBar';
import { ClientNavDrawer } from './ClientNavDrawer';
import { ClientBottomNav } from './ClientBottomNav';
import { BottomSheet } from './BottomSheet';
import { CLIENT_NAV_OVERFLOW } from './clientNavConfig';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const nav = t.client.nav as Record<string, string>;
  const sheet = t.client.moreSheet;

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      {/* Desktop sidebar */}
      <ClientSidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ClientTopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 md:pb-4 lg:pb-6">{children}</main>
      </div>

      {/* Tablet nav drawer */}
      <ClientNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Mobile bottom nav */}
      <ClientBottomNav onMoreClick={() => setMoreSheetOpen(true)} />

      {/* More sheet (mobile) */}
      <BottomSheet open={moreSheetOpen} onClose={() => setMoreSheetOpen(false)} title={sheet.title}>
        <div className="-mx-5 -mt-4">
          {CLIENT_NAV_OVERFLOW.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreSheetOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium transition-colors',
                  active ? 'text-amber-700' : 'text-ink-800 hover:bg-sand-100'
                )}
              >
                <Icon
                  size={19}
                  className={cn('shrink-0', active ? 'text-amber-700' : 'text-ink-500')}
                />
                {nav[item.id] ?? item.id}
              </Link>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
