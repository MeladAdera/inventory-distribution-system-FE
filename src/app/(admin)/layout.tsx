'use client';

import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingSpinner } from '@/common/components';
import { DashboardLayout } from '@/common/layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
