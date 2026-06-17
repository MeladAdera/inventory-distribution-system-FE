'use client';

import { useState, type ReactNode } from 'react';
import { ClientSidebar } from './ClientSidebar';
import { ClientTopBar } from './ClientTopBar';
import { ClientNavDrawer } from './ClientNavDrawer';
import { ClientBottomNav } from './ClientBottomNav';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      <ClientBottomNav />
    </div>
  );
}
