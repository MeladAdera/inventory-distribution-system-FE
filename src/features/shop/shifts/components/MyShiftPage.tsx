'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, WifiOff } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import { usePermission } from '@/common/hooks/usePermission';
import { useOnlineStatus } from '@/common/offline/connectivity/useOnlineStatus';
import { useOpenShift } from '../hooks/useOpenShift';
import { ShiftStatusCard } from './my-shift/ShiftStatusCard';
import { StartShiftModal } from './my-shift/StartShiftModal';
import { CloseShiftModal } from './my-shift/CloseShiftModal';

/**
 * Start and end a shift. Reached by owners and employees alike.
 *
 * Online-only by design: the close needs the server's frozen cash arithmetic and
 * the open needs its one-shift-per-shop check, and neither can be faked locally.
 * Selling stays available offline — only this page needs the connection.
 */
export function MyShiftPage() {
  const { t, locale } = useI18n();
  const s = t.shifts;
  const toast = useToast();
  const { isShopOwner } = usePermission();
  const isOnline = useOnlineStatus();

  const [startOpen, setStartOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const {
    openShift,
    isMine,
    suggestedFloat,
    isLoading,
    error,
    startShift,
    isStarting,
    closeShift,
    isClosing,
  } = useOpenShift({ withSuggestedFloat: true });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]">{s.myShift.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <AlertTriangle size={28} className="text-danger-700" />
        <p className="text-[14px] text-ink-600">{s.myShift.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <header className="mb-6 text-center">
        <h1 className="text-[20px] font-semibold text-ink-900">{s.myShift.title}</h1>
        <p className="mt-1 text-[13px] text-ink-500">{s.myShift.subtitle}</p>
      </header>

      {!isOnline && (
        <div className="mx-auto mb-4 flex max-w-lg items-start gap-3 rounded-lg border border-border bg-amber-50 px-4 py-3">
          <WifiOff size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <p className="text-[13px] font-medium text-ink-800">{s.myShift.offlineTitle}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">
              {s.myShift.offlineBody}
            </p>
          </div>
        </div>
      )}

      <ShiftStatusCard
        session={openShift}
        isMine={isMine}
        isOwner={isShopOwner}
        locale={locale}
        currency={t.debts.currency}
        onStart={() => setStartOpen(true)}
        onClose={() => setCloseOpen(true)}
        labels={s.myShift}
      />

      <StartShiftModal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        suggestedFloat={suggestedFloat}
        onStart={async (data) => {
          const result = await startShift(data);
          toast.success(s.start.toastSuccess);
          return result;
        }}
        isStarting={isStarting}
        currency={t.debts.currency}
        labels={s.start}
      />

      {/* Mounted only with a shift to close, so the modal never has a null session. */}
      {openShift && (
        <CloseShiftModal
          open={closeOpen}
          onClose={() => setCloseOpen(false)}
          session={openShift}
          isMine={isMine}
          onCloseShift={async (data) => {
            const result = await closeShift({ id: openShift.id, data });
            toast.success(s.close.toastSuccess);
            return result;
          }}
          isClosing={isClosing}
          currency={t.debts.currency}
          labels={{ ...s.close, result: s.result }}
        />
      )}
    </div>
  );
}
