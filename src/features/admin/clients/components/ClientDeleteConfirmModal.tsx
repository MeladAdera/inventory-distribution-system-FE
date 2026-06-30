'use client';

import { useEffect } from 'react';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import type { AdminClient } from '../types/clients.types';

interface ClientDeleteConfirmModalProps {
  open: boolean;
  client: AdminClient | null;
  onClose: () => void;
  onConfirm: (client: AdminClient) => void;
}

export function ClientDeleteConfirmModal({
  open,
  client,
  onClose,
  onConfirm,
}: ClientDeleteConfirmModalProps) {
  const { t, locale } = useI18n();
  const p = t.clients;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !client) return null;

  const name = locale === 'ar' ? client.name_ar : client.name_en;
  const willActivate = client.status === 'inactive';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" />

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
          <div
            className={cn(
              'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0',
              willActivate ? 'bg-teal-100' : 'bg-danger-100'
            )}
          >
            {willActivate ? (
              <RotateCcw size={20} className="text-teal-700" />
            ) : (
              <AlertTriangle size={20} className="text-danger-700" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {willActivate ? p.activate.title : p.delete.title}
            </p>
            <p className="text-sm text-ink-600 mt-1">{name}</p>
            <p className="text-[13px] text-ink-500 mt-2">
              {willActivate ? p.activate.warning : p.delete.warning}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 pb-6">
          <button
            onClick={() => onConfirm(client)}
            className={cn(
              'inline-flex items-center gap-2 h-10 px-5 text-white text-sm font-medium rounded-lg transition-colors',
              willActivate
                ? 'bg-teal-700 hover:bg-teal-700/90'
                : 'bg-danger-700 hover:bg-danger-700/90'
            )}
          >
            {willActivate ? <RotateCcw size={15} /> : <Trash2 size={15} />}
            {willActivate ? p.activate.confirm : p.delete.delete}
          </button>
          <button
            onClick={onClose}
            className="h-10 px-5 border border-border rounded-lg text-sm text-ink-700 font-medium hover:bg-sand-100 transition-colors"
          >
            {willActivate ? p.activate.cancel : p.delete.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
