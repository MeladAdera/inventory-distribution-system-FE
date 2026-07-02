'use client';

import { X, Loader2 } from 'lucide-react';
import { AuditLogTypeBadge } from './AuditLogTypeBadge';
import { useAuditLogDetail } from '@/features/admin/audit-logs';

function formatDateTime(iso: string, locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

interface AuditLogDetailModalLabels {
  title: string;
  logId: string;
  user: string;
  type: string;
  action: string;
  entity: string;
  product: string;
  quantity: string;
  notes: string;
  date: string;
  closeBtn: string;
}

interface AuditLogDetailModalProps {
  logId: number | null;
  open: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
  labels: AuditLogDetailModalLabels;
  typeLabels: Record<string, string>;
  actionLabels: Record<string, string>;
  entityLabels: Record<string, string>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-border last:border-b-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <div className="text-[14px] text-ink-800">{children}</div>
    </div>
  );
}

export function AuditLogDetailModal({
  logId,
  open,
  onClose,
  locale,
  labels,
  typeLabels,
  actionLabels,
  entityLabels,
}: AuditLogDetailModalProps) {
  const { log, isLoading } = useAuditLogDetail(logId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-md bg-paper rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[16px] font-semibold text-ink-900">{labels.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:bg-sand-100 hover:text-ink-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-ink-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : log ? (
            <>
              <DetailRow label={labels.logId}>
                <span className="font-mono text-ink-600">#{log.id}</span>
              </DetailRow>

              <DetailRow label={labels.date}>{formatDateTime(log.created_at, locale)}</DetailRow>

              <DetailRow label={labels.user}>{log.user_name}</DetailRow>

              <DetailRow label={labels.type}>
                <AuditLogTypeBadge type={log.type} label={typeLabels[log.type] ?? log.type} />
              </DetailRow>

              <DetailRow label={labels.action}>{actionLabels[log.action] ?? log.action}</DetailRow>

              <DetailRow label={labels.entity}>
                {entityLabels[log.entity_type] ?? log.entity_type} #{log.entity_id}
              </DetailRow>

              {log.product_name && <DetailRow label={labels.product}>{log.product_name}</DetailRow>}

              {log.quantity != null && (
                <DetailRow label={labels.quantity}>
                  <span className={log.quantity < 0 ? 'text-danger-600' : 'text-success-600'}>
                    {log.quantity > 0 ? `+${log.quantity}` : String(log.quantity)}
                  </span>
                </DetailRow>
              )}

              {log.notes && <DetailRow label={labels.notes}>{log.notes}</DetailRow>}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-ink-900 text-sand-100 text-[14px] font-semibold hover:bg-ink-800 transition-colors"
          >
            {labels.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
