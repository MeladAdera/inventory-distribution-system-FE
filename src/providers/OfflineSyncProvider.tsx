'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  startConnectivityMonitor,
  useOnlineStatus,
} from '@/common/offline/connectivity/useOnlineStatus';
import {
  initStockSyncEngine,
  flushStockQueue,
  useStockSyncQueue,
} from '@/features/shared/inventory/offline/stockSyncEngine';
import { useToast } from './ToastProvider';
import { useI18n } from './I18nProvider';

// App-shell wiring for the offline mutation queue. Mounted inside ToastProvider
// (needs toasts) and QueryProvider/AuthProvider (needs the client + auth).
export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  const { pendingCount, hasConflicts } = useStockSyncQueue();
  const { success } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const wasOnline = useRef(isOnline);
  const prevPending = useRef(pendingCount);

  // One-time startup: connectivity monitor, engine hydration, interval fallback flush.
  useEffect(() => {
    const stopMonitor = startConnectivityMonitor();
    void initStockSyncEngine();
    const intervalId = window.setInterval(() => {
      void flushStockQueue();
    }, 30000);
    return () => {
      stopMonitor();
      window.clearInterval(intervalId);
    };
  }, []);

  // Auto-flush the moment we transition offline → online.
  useEffect(() => {
    if (isOnline && !wasOnline.current) {
      void flushStockQueue();
    }
    wasOnline.current = isOnline;
  }, [isOnline]);

  // When the pending count drains to zero with no conflicts, the sync succeeded.
  // Refetch inventory so authoritative server quantities replace the optimistic ones.
  useEffect(() => {
    if (prevPending.current > 0 && pendingCount === 0 && !hasConflicts) {
      success(t.offline.toast.syncSuccess);
      void queryClient.invalidateQueries({ queryKey: ['client-inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['client-inventory-products'] });
    }
    prevPending.current = pendingCount;
  }, [pendingCount, hasConflicts, success, t, queryClient]);

  return <>{children}</>;
}
