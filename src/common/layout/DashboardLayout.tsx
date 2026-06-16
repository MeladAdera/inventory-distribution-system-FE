'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Truck, Settings, LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NavDrawer } from './NavDrawer';
import { BottomNav } from './BottomNav';
import { BottomSheet } from './BottomSheet';
import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/features/auth';
import { getInitials } from '@/common/utils/string.utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useI18n();
  const { logout, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const s = t.bottomnav.sheet as Record<string, string>;
  const roles = t.sidebar.user.roles as Record<string, string>;
  const displayName = user?.name ?? '';
  const roleLabel = user?.role ? (roles[user.role] ?? user.role) : '';
  const initials = getInitials(displayName);

  const sheetNavItems = [
    { href: '/transfers', icon: Truck, label: s.transfers },
    { href: '/settings', icon: Settings, label: s.settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 md:pb-4 lg:pb-6">{children}</main>
      </div>

      {/* Tablet nav drawer */}
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Mobile bottom nav */}
      <BottomNav onMoreClick={() => setMoreSheetOpen(true)} />

      {/* More sheet (mobile) */}
      <BottomSheet
        open={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        title={t.bottomnav.nav.more}
      >
        {/* Nav items */}
        <div className="-mx-5 -mt-4">
          {sheetNavItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreSheetOpen(false)}
              className="flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium text-ink-800 hover:bg-sand-100 transition-colors"
            >
              <Icon size={19} className="text-ink-500 shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        {/* Divider + user block */}
        <div className="border-t border-border -mx-5 mt-1 px-5 pt-4 pb-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-ink-900 flex items-center justify-center shrink-0">
              <span className="text-[13px] font-semibold text-amber-500">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-ink-900 truncate">{displayName}</p>
              <p className="text-[12px] text-ink-500 truncate">{roleLabel}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              setMoreSheetOpen(false);
            }}
            className="flex items-center gap-3 w-full py-2 text-[15px] font-medium text-danger-700 hover:opacity-80 transition-opacity"
          >
            <LogOut size={17} className="shrink-0" />
            {s.logout}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
