'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NavDrawer } from './NavDrawer';
import { BottomNav } from './BottomNav';
import { BottomSheet } from './BottomSheet';
import { useI18n } from '@/providers/I18nProvider';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>

      {/* Tablet nav drawer */}
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Mobile bottom nav */}
      <BottomNav onMoreClick={() => setMoreSheetOpen(true)} />

      {/* More sheet (mobile) */}
      <BottomSheet
        open={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        title={t.bottomnav.nav.more ?? 'More'}
      >
        <p className="text-sm text-ink-400 text-center">
          {/* More sheet content populated per Figma ticket */}
        </p>
      </BottomSheet>
    </div>
  );
}
