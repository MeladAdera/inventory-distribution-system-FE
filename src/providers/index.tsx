'use client';

import { ReactNode } from 'react';
import { I18nProvider } from './I18nProvider';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { ToastProvider } from './ToastProvider';
import { OfflineSyncProvider } from './OfflineSyncProvider';
import { DemoBanner } from '@/common/components/DemoBanner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <DemoBanner />
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <OfflineSyncProvider>{children}</OfflineSyncProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </I18nProvider>
  );
}

export { useToast } from './ToastProvider';
export { useI18n } from './I18nProvider';
