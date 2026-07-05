'use client';

import { useState } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, LogIn } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useOnlineStatus } from '@/common/offline/connectivity/useOnlineStatus';
import {
  useStockSyncQueue,
  useStockSyncAuthRequired,
} from '@/features/shared/inventory/offline/stockSyncEngine';
import { SyncConflictModal } from '@/features/shop/components/inventory/SyncConflictModal';

// App-shell banner for the shop portal. Mounted in ClientLayout so it's visible
// across /client/* — not just while the inventory page is open.
export function OfflineSyncBanner() {
  const { t } = useI18n();
  const b = t.offline.banner;
  const isOnline = useOnlineStatus();
  const authRequired = useStockSyncAuthRequired();
  const { pendingCount, conflictCount, hasPending, hasConflicts } = useStockSyncQueue();
  const [modalOpen, setModalOpen] = useState(false);

  // Nothing to communicate: online, nothing queued, no auth issue.
  const idle = isOnline && !hasPending && !hasConflicts && !authRequired;
  if (idle) return null;

  // Highest-priority state wins.
  let tone: 'danger' | 'warning' | 'info' = 'info';
  let icon = <RefreshCw size={15} className="animate-spin shrink-0" />;
  let message = b.syncing;

  if (authRequired) {
    tone = 'danger';
    icon = <LogIn size={15} className="shrink-0" />;
    message = b.needsLogin;
  } else if (hasConflicts) {
    tone = 'danger';
    icon = <AlertTriangle size={15} className="shrink-0" />;
    message = b.pending.replace('{count}', String(conflictCount));
  } else if (!isOnline) {
    tone = 'warning';
    icon = <WifiOff size={15} className="shrink-0" />;
    message = hasPending
      ? `${b.offline} ${b.pending.replace('{count}', String(pendingCount))}`
      : b.offline;
  } else {
    // online + pending → actively syncing
    tone = 'info';
    icon = <RefreshCw size={15} className="animate-spin shrink-0" />;
    message = b.syncing;
  }

  const toneClasses = {
    danger: 'bg-danger-50 text-danger-800 border-danger-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  }[tone];

  return (
    <>
      <div
        className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium border-b ${toneClasses}`}
        role="status"
      >
        {icon}
        <span className="flex-1 min-w-0">{message}</span>
        {hasConflicts && (
          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 underline underline-offset-2 hover:no-underline"
          >
            {b.viewConflicts.replace('{count}', String(conflictCount))}
          </button>
        )}
      </div>

      <SyncConflictModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
