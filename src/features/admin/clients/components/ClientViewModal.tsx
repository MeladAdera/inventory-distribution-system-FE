'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { ClientAvatar } from './ClientAvatar';
import { ClientStatusBadge } from './ClientStatusBadge';
import type { AdminClient } from '../types/clients.types';

interface ClientViewModalProps {
  open: boolean;
  client: AdminClient | null;
  onClose: () => void;
}

export function ClientViewModal({ open, client, onClose }: ClientViewModalProps) {
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
  const city = locale === 'ar' ? client.city_ar : client.city_en;
  const lastActivity = locale === 'ar' ? client.last_activity_ar : client.last_activity_en;
  const statusLabel = p.toolbar.statuses[client.status];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full bg-paper flex flex-col max-h-[90vh]',
          'sm:rounded-xl sm:max-w-110',
          'rounded-t-2xl sm:rounded-t-xl',
          'animate-pop-in'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-ink-900">{p.view.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="flex items-center gap-3">
            <ClientAvatar name={name} size={44} />
            <div className="min-w-0">
              <p className="font-medium text-ink-900 truncate">{name}</p>
              <div className="mt-1">
                <ClientStatusBadge status={client.status} label={statusLabel} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Detail label={p.view.phone}>
              <span className="font-mono" dir="ltr">
                {client.phone}
              </span>
            </Detail>
            <Detail label={p.view.address}>{city}</Detail>
            <Detail label={p.view.products}>
              <span className="font-mono">{client.product_count}</span>
            </Detail>
            <Detail label={p.view.lastActivity}>{lastActivity}</Detail>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 border border-border rounded-lg text-sm text-ink-700 font-medium hover:bg-sand-100 transition-colors"
          >
            {p.view.close}
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <span className="text-sm text-ink-900">{children}</span>
    </div>
  );
}
