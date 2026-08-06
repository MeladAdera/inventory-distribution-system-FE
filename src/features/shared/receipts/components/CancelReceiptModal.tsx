'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { CANCEL_REASON_MAX_LENGTH } from '../types/receipts.types';

interface CancelReceiptModalProps {
  open: boolean;
  receiptId: number | null;
  isCancelling: boolean;
  onClose: () => void;
  /** Reason is omitted entirely when left blank — the API treats it as optional */
  onConfirm: (reason?: string) => Promise<void>;
  labels: {
    title: string;
    warning: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    confirmBtn: string;
    keepBtn: string;
  };
}

export function CancelReceiptModal({
  open,
  receiptId,
  isCancelling,
  onClose,
  onConfirm,
  labels,
}: CancelReceiptModalProps) {
  const [reason, setReason] = useState('');

  // Reset between openings so a previous draft never leaks into the next receipt
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  // No body-scroll lock here on purpose: this opens on top of ReceiptDetailModal,
  // which already holds the lock. Locking twice would unlock on this one's close.

  if (!open || receiptId === null) return null;

  const trimmed = reason.trim();

  async function handleConfirm() {
    await onConfirm(trimmed || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className={cn(
          'relative z-10 w-full bg-paper flex flex-col',
          'sm:rounded-xl sm:max-w-110',
          'rounded-t-2xl sm:rounded-t-xl',
          'animate-pop-in'
        )}
      >
        {/* Body */}
        <div className="px-6 pt-6 pb-5 flex gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-danger-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-danger-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-900">
              {labels.title} #{receiptId}
            </p>
            <p className="text-[13px] text-ink-500 mt-2">{labels.warning}</p>

            <label className="block mt-4">
              <span className="text-[13px] font-medium text-ink-700">{labels.reasonLabel}</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={CANCEL_REASON_MAX_LENGTH}
                rows={3}
                placeholder={labels.reasonPlaceholder}
                className="mt-1.5 w-full rounded-lg border border-border bg-paper px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 resize-none focus:outline-none focus:border-ink-400 transition-colors"
              />
            </label>
            <p className="mt-1 text-[11px] text-ink-400 text-end tabular-nums">
              {reason.length} / {CANCEL_REASON_MAX_LENGTH}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 pb-6">
          <button
            onClick={handleConfirm}
            disabled={isCancelling}
            className="inline-flex items-center gap-2 h-10 px-5 bg-danger-700 hover:bg-danger-700/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {isCancelling ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
            {labels.confirmBtn}
          </button>
          <button
            onClick={onClose}
            disabled={isCancelling}
            className="h-10 px-5 border border-border rounded-lg text-sm text-ink-700 font-medium hover:bg-sand-100 transition-colors disabled:opacity-60"
          >
            {labels.keepBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
